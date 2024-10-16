<script>
  import "prism-themes/themes/prism-coldark-dark.css";
</script>

<div id="layout">
  <div id="links" class="">
    <a href="/" class="link">About</a>

    <a href="/posts" class="link">Posts</a>
  </div>
  <div class="content">
    <slot />
  </div>
</div>

<style lang="scss">
  :global(*) {
    color: white;
  }

  :global(html, body) {
    display: flex;
    justify-content: center;
    width: 100%;
    margin: 0;
    padding: 0;
    min-height: 100%;
    background-color: #272727;
  }

  :global(h1, h2, h3, h4),
  a {
    font-family: sans-serif;
    font-weight: 800;
  }

  :global(p, li, a) {
    font-family: sans-serif;
  }

  :global(a) {
    color: rgb(164, 246, 255);
    text-decoration: underline;
  }

  :global(img) {
    max-width: 100%;
  }

  #layout {
    border-radius: 1em;
    background-image: linear-gradient(120deg, #000000 0%, #000000 100%);
    width: 100%;
    display: flex;
    height: fit-content;
    
    overflow: clip;
    filter: drop-shadow(20px 20px 40px rgba(0, 0, 0, 0.269));

    @media (min-width: 800px) {
      margin: 3em;
      width: 50em;
    }

    @media (max-width: 800px) {
      border-radius: 0;
      margin: 0;
    }

    & #links {
      padding: 0.5em 0em;
      margin: 0em 0em;
      max-width: 100%;
      background-color: #111b27;
      margin-bottom: 0em;
      display: flex;
      flex-direction: row;
      position: sticky;
      top: 0em;
      gap: 0em 0em;
      place-content: center;
      justify-content: space-evenly;
      font-size: large;
      flex-wrap: wrap;

      & .link {
        text-decoration: none;
        font-weight: 800;
        font-size: 2em;
        color: inherit;
        &:hover {
          text-decoration: underline;
        }
      }
      /* p-2 bg-white mb-4 border-b border-black flex flex-row gap-8 place-content-center text-lg sticky top-0 items-center */
    }

    .content {
      padding: 2em;
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
