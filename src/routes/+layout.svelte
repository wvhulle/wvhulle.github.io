<script>
  import "prism-themes/themes/prism-cb.css";
</script>

<div id="layout">
  <div id="links" class="">
    <a href="/" class="link">Home</a>

    <a href="/projects" class="link">Projects</a>

    <a href="/edu" class="link">Educational</a>

    <a href="/about" class="link">About</a>
  </div>
  <div class="content">
    <slot />
  </div>
</div>

<style lang="scss">
  :global(*) {
    color: white;
  }

  * {
    font-family: "Gill Sans", "Gill Sans MT", Calibri, "Trebuchet MS",
      sans-serif;
  }

  :global(html, body) {
    display: flex;
    justify-content: center;
    width: 100%;
    margin: 0;
    padding: 0;
    min-height: 100%;
    background-color: rgb(0, 0, 0);
  }

  :global(a) {
    color: rgb(132, 228, 255);
  }

  :global(img) {
    max-width: 100%;
  }

  #layout {
    background-image: linear-gradient(120deg, #00657e 0%, #2b2b2b 100%);
    margin: 0;
    width: 100%;
    display: flex;

    @media (min-width: 800px) {
      width: 50em;
    }

    & #links {
      padding: 0.5em 0em;
      margin: 0em 1em;
      max-width: 100%;
      background-color: #222222;
      border-radius: 0.2em;
      backdrop-filter: blur(0.3em);
      margin-bottom: 1em;
      display: flex;
      flex-direction: row;
      position: sticky;
      top: 0.5em;
      gap: 0em 0em;
      place-content: center;
      justify-content: space-evenly;
      font-size: large;
      flex-wrap: wrap;

      & .link {
        text-decoration: none;
        font-weight: 400;
        font-size: larger;
        color: inherit;

        &:hover {
          text-decoration: underline;
        }
      }
      /* p-2 bg-white mb-4 border-b border-black flex flex-row gap-8 place-content-center text-lg sticky top-0 items-center */
    }

    .content {
      padding: 2em;
      flex-grow: 1;
      flex-direction: column;
      display: flex;

      @media (max-width: 800px) {
        padding: 1em;
      }
      
    }

    flex-direction: column;
    position: relative;
  }


</style>
