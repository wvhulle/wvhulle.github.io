<svelte:head>
  <title>Willem Vanhulle</title>
</svelte:head>

<div id="header">
  <div id="left">
    <h1>Willem Vanhulle</h1>
    <h2 class="">Software engineer</h2>

    <h3 class="">Ghent, Belgium</h3>
  </div>

  <div id="profile">
  <img src="lab.jpg" alt="Willem in the lab" />
  </div>
</div>

<div id="body">
  
  <p>
  </p>

  
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
    width: 20em;
    aspect-ratio: 1;
  }

  #spacer {
    display: flex;

    flex-grow: 1;
  }

  #profile {
    border-radius: 50%;
    background-color: rgb(0, 0, 0);
    overflow: hidden;
    aspect-ratio: 1;
    margin: 2em 4em;
    filter: drop-shadow(10px 10px 4px #00000081);
    }

  #footer {
    padding: 1em;
    align-self: flex-end;
    font-size: 0.7em;
    font-style: italic;
  }
</style>
