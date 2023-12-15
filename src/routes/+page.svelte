<svelte:head>
  <title>Willem Vanhulle</title>
</svelte:head>

<div id="header">
  <div id="left">
    <h1>Willem Vanhulle</h1>
    <h2 class="">Software engineer</h2>

    <h3 class="">Ghent, Belgium</h3>
  </div>

  <img src="lab.jpg" alt="Willem in the lab" />
</div>

<div id="body">
  
  <p>
    
  </p>

  
</div>

<div id="spacer"></div>

<div id="footer">
  To make your own personal website, see the <a
    href="https://github.com/wvhulle/wvhulle.github.io">source code</a
  > of this website.
</div>

<style lang="scss">
  #header {
    width: 100%;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    justify-items: center;
    padding: auto;
  }

  h1 {
    font-weight: 700;
    font-size: 2em;
    font-family: Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif;
    margin: 0;
    line-height: 1em;
    text-align: right;
  }

  h2,h3 {
    font-weight: 400;
    text-align: right;

    padding: 0.5em 0;
    margin: 0;
  }

  #body {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }

  img {
    width: 15em;
    margin: 1em;
    aspect-ratio: 1;
  }

  #spacer {
    display: flex;

    flex-grow: 1;
  }

  #footer {
    padding: 1em;
    align-self: flex-end;
    font-size: 0.7em;
    font-style: italic;
  }
</style>
