<svelte:head>
  <title>Willem Vanhulle</title>
</svelte:head>

<div id="header">
  <div id="left">
    <h1>Willem Vanhulle</h1>
    <h2 class="">Ghent, Belgium</h2>
    <h2 class="">Rust Developer</h2>

    <h3 class="">
      <a href="https://www.linkedin.com/in/willem-vanhulle-2657aa180/">
        LinkedIn
      </a>,

      <a href="mailto:willemvanhulle@gmail.com">
        E-mail
      </a>
    </h3>

    <h3 class="">
      
    </h3>
  </div>

  <div id="profile">
    <img src="lab.jpg" alt="Willem in the lab" />
  </div>
</div>

<div id="body">
  <p></p>
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

  h1,
  h2,
  h3,
  a {
    margin: 0 0em;
    text-align: right;
  }

  h1 {
    font-size: 2em;
  }

  h2,
  h3 {

   
    font-weight: 400;
  }

  h3 {
    font-style: italic;
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

  #profile {
    border-radius: 50%;
    background-color: rgb(0, 0, 0);
    overflow: hidden;
    aspect-ratio: 1;
    margin: 2em 4em;
    filter: drop-shadow(10px 10px 4px #00000081);
  }
</style>
