<script>
  import "../app.css";

  import { base } from "$app/paths";
</script>

<div id="layout">
  <div id="links" class="">
    <a href="{base}/" class="link">Home</a>

    <a href="{base}/biography" class="link">Biography</a>

    <a href="{base}/skills" class="link">Skills</a>

    <a href="{base}/portfolio" class="link">Portfolio</a>
  </div>
  <slot />
</div>

<style>
  * {
    font-family: Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif;
  }

  :global(html, body) {
    display: flex;
    width: 100%;
    margin: 0;
    padding: 0;
    min-height: 100%;
  }

  #layout {
    background-image: linear-gradient(120deg, #ffffff 0%, #98cdff 100%);

    margin: 0;
    width: 100%;
    display: flex;
    padding-left: 20%;
    padding-right: 20%;
    flex-direction: column;
    position: relative;
  }

  .link {
    text-decoration: none;
    font-weight: 600;
    color: inherit;
  }

  #links {
    padding: 0.5em;
    background-color: rgba(0, 29, 80, 0.831);
    backdrop-filter: blur(0.3em);
    color: white;
    width: 100%;
    margin-bottom: 1em;
    display: flex;
    position: sticky;
    top: 0.5em;
    gap: 3em;
    place-content: center;
    place-items: center;
    font-size: large;

    /* p-2 bg-white mb-4 border-b border-black flex flex-row gap-8 place-content-center text-lg sticky top-0 items-center */
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
