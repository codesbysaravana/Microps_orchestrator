const chatModel = async (userPrompt) => {
    const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({
            model: 'gemma3:1b',
            prompt: userPrompt, //needs text
            stream: false
        })
    }); //returns obj

    const res = await response.json();
    console.log(res);
    console.log(res.response);
    return res.response;
}

module.exports = { chatModel };