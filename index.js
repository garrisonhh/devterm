const term = new Terminal();

/** run the shell */
async function execCommand(text) {
    // do command
    const req = new Request("/exec", {
        method: 'POST',
        body: text,
    });

    let output = await fetch(req)
        .then((res) => res.text());

    output = output.replaceAll('\n', '\r\n');

    // write to terminal
    term.reset();
    term.writeln(`$ ${text}`);
    term.write(output);

    term.write('\r');
    if (output.length > 0 && !output.endsWith('\n')) {
        term.write('\n');
    }
}

/** when you press enter in the text field */
function onCmdInput(ev) {
    execCommand(ev.target.value);
}

function onRun(ev) {
    const cmd = ev.target.parentElement;
    const text_field = cmd.getElementsByClassName('command-text')[0];

    execCommand(text_field.value);
}

function onDelete(ev) {
    const cmd = ev.target.parentElement;
    const inputs = cmd.parentElement;
    inputs.removeChild(cmd);
}

/**
 * creates a div like the following:
 * ```html
 * <div id="command-%num%" class="command"></div>
 * ```
 * with all of the necessary buttons, etc. and appends it to the inputs div
 */
function addCommandInput() {
    const inputs = document.getElementById('inputs');

    // collected div
    const div = document.createElement('div');
    inputs.appendChild(div);

    div.classList.add("command");

    // inputs
    const number = document.createElement('div');
    div.appendChild(number);

    number.classList.add("command-label");
    number.innerText = `${inputs.children.length}`;

    const text_input = document.createElement('input');
    div.appendChild(text_input);
    text_input.addEventListener('change', onCmdInput);

    text_input.classList.add("command-text");
    text_input.type = "text";
    text_input.placeholder = "echo 'hello world'";

    const run_btn = document.createElement('button');
    div.appendChild(run_btn);
    run_btn.addEventListener('click', onRun);

    run_btn.classList.add("command-btn");
    run_btn.classList.add("command-run");
    run_btn.innerText = '▷';

    const del_btn = document.createElement('button');
    div.appendChild(del_btn);
    del_btn.addEventListener('click', onDelete);

    del_btn.classList.add("command-btn");
    del_btn.classList.add("command-del");
    del_btn.innerText = '⤫';
}

function initTerminal() {
    const term_div = document.getElementById('terminal');
    term.open(term_div);
}

function initInputs() {
    const new_cmd = document.getElementById('command-new');
    new_cmd.addEventListener('click', addCommandInput);

    addCommandInput();
}

function main() {
    initTerminal();
    initInputs();
}

addEventListener('load', main);
