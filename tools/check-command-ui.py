from pathlib import Path
import json, re, subprocess
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
fixture=(root/'test/fixture-command-ui.html').read_text()
fixture=re.sub(r'<script type="module">.*?</script>', '', fixture,flags=re.S)
source=(root/'src/command-ui.js').read_text()
source=re.sub(r'^import .*?;\s*$', '', source, flags=re.M)
source=source.replace('export function setupCommandUI', 'function setupCommandUI')
source+='\nwindow.setupCommandUI=setupCommandUI;'
lines=['/sco','/scoreboard ','/scoreboard players ','/worldborder damage ','/weather rain']
cli="import {suggestions,activeHelp} from './src/commands.js'; import {commandImplementation} from './src/command-catalog.js'; const cases="+json.dumps(lines)+";console.log(JSON.stringify(Object.fromEntries(cases.map(s=>[s,{suggestions:suggestions(s),help:activeHelp(s)}]))));"
result=subprocess.run(['node','--input-type=module','-e',cli],cwd=root,check=True,capture_output=True,text=True)
results=json.loads(result.stdout)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':390,'height':844})
    page.set_content(fixture)
    page.evaluate('''(data)=>{window.testData=data;window.testApi={COMMANDS:[],suggestions:(line)=>data[line]?.suggestions||[],activeHelp:(line)=>data[line]?.help||null,executeCommand:(line)=>({ok:line.startsWith('/weather '),message:'weather updated'}),commandImplementation:()=>'부분 실행'};}''',results)
    source=source.replace("// Browser-only accessible command palette. All suggestions use textContent (no user HTML).", "const {COMMANDS,suggestions,activeHelp,executeCommand,commandImplementation}=window.testApi;")
    page.add_script_tag(content=source)
    page.evaluate('''()=>{window.testUI=window.setupCommandUI({onOpen:()=>{},onClose:()=>{},onResult:()=>{},context:()=>({})});window.testUI.show()}''')
    inp=page.locator('#commandInput')
    inp.fill('/sco');inp.press('Tab');assert inp.input_value()=='/scoreboard '
    inp.fill('/scoreboard ');inp.press('Tab');assert inp.input_value().startswith('/scoreboard objectives ')
    inp.fill('/scoreboard players ');inp.press('Tab');first=inp.input_value();inp.press('Tab');second=inp.input_value()
    assert first!=second,(first,second)
    inp.fill('/worldborder damage ');assert page.locator('.command-choice').count()==2
    inp.fill('/weather rain');inp.press('Enter');assert page.locator('#commandPanel').get_attribute('class').endswith('hidden')
    page.evaluate('''()=>window.testUI.show()''');inp.fill('/worldborder damage ')
    page.screenshot(path=str(root/'docs/COMMAND_189_UI_MOBILE.png'),full_page=True)
    print('BROWSER UI PASS: tab command / argument / consecutive cycling / subcommand / submit / reopen / mobile screenshot')
    browser.close()
