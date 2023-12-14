<script>
  import "prism-themes/themes/prism-cb.css";
  import { base } from "$app/paths";
</script>

<div id="layout">
  <div id="links" class="">
    <a href="{base}/" class="link">Home</a>

    <a href="{base}/projects" class="link">Projects</a>

    <a href="{base}/educational" class="link">Educational</a>

    <a href="{base}/about" class="link">About</a>
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
    font-family:Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif;
    font-size: 1.1em;
    line-height: 1.4em;
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
    background-image: linear-gradient(120deg, #005476 0%, #012444 100%);
    margin: 0;
    width: 100%;
    display: flex;

    @media (min-width: 800px) {
      width: 40em;
    }

    & #links {
      padding: 0.5em 0em;
      margin: 0em 1em;
      max-width: 100%;
      background-color: #222222;
      border-radius: 0.5em;
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
        font-weight: 600;
        color: inherit;
      }
    /* p-2 bg-white mb-4 border-b border-black flex flex-row gap-8 place-content-center text-lg sticky top-0 items-center */
  }

    
    .content {
      padding: 2em;
      flex-grow: 1;
      flex-direction: column;
      height: 100%;
      display:flex;

      @media (max-width: 800px) {
      padding: 1em;
    }
    }
    

    

    flex-direction: column;
    position: relative;
  }

  

  a {
    display: block;
    position: relative;
    padding: 0.2em 0;
  }

  /* Fade in */
  a::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 0.1em;
    background-color: rgb(255, 255, 255);
    opacity: 0;
    transition:
      opacity 300ms,
      transform 300ms;
  }

  a:hover::after,
  a:focus::after {
    opacity: 1;
    transform: translate3d(0, 0.2em, 0);
  }
  div a::after {
    opacity: 1;
    transform: scale(0);
    transform-origin: center;
  }

  div a:hover::after,
  div a:focus::after {
    transform: scale(1);
  }
</style>
