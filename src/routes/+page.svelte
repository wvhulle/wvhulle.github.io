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
      Working in a friendly bio-technological company at Zwijnaarde, Belgium.
      
    </p>


    <p>
      I'm open to projects related to web and app development using open
      software.
    </p>
  </div>

  <div id="spacer"></div>

  <div id="footer">
    To make your own page, see the <a
      href="https://github.com/wvhulle/wvhulle.github.io">source code</a
    > of this website.
  </div>

<style>
  #header {
    /* w-full h-full prose mx-auto pb-5 pt-5 */
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    justify-items: center;
    padding: auto;
  }

  h1 {
    font-weight: 400;
    margin: 0;
    text-align: center;
  }

  h2,
  h3 {
    padding: 0;
    margin: 0;
  }

  #body {
    display: flex;
    flex-direction: column;
  }

  #profile {
    margin: 2em;
    place-self: center;
    justify-self: center;
    width: 10vw;
    border-radius: 100%;
    overflow: hidden;
  }

  img {
    width: 100%;
    aspect-ratio: 1;
  }

  #spacer {
    display:flex;

    flex-grow: 1;;
  }

  #footer {
    padding: 1em;
    align-self: flex-end;
    font-size: 0.7em;
    font-style: italic;
  }
</style>
