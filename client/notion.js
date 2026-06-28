async function connectNotion(event) {
    event.preventDefault();

    const notionToken = document.getElementById('notionToken').value;
    const notionDB = document.getElementById('notionDatabaseId').value;
    console.log(notionDB);

    const sendToServer = JSON.stringify({notionToken, notionDB});
    //console.log(sendToServer);

    const response = await fetch('/connect', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: sendToServer //pure string
    });

    console.log(typeof response);
    const data = await response.json();
    console.log(data[0].id);
    console.log(data[0].properties);
    console.log(data[0].title);
    console.log(data);

    let databases = data;
    renderDB(databases);
}

function renderDB(databases) {
    const display = document.getElementById("displaydb");
    display.innerHTML = '';
    databases.forEach((db) => {
        const div = document.createElement('div');

        div.textContent = db.title;
        div.dataset.id = db.id;

        display.appendChild(div);
    });
}

//notion-conn-name = MicrOps
//notion-pass = ntn_q94949894758TDD8qV2emaCO75wE9l2aOYn4xzrkIMK15F