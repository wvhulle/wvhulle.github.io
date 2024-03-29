import adapter from "@sveltejs/adapter-static";
import preprocess from "svelte-preprocess";
import { mdsvex } from "mdsvex";

const dev = process.env.NODE_ENV === "development";

console.log(process.env.NODE_ENV)

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: [".svelte", ".svx"],

  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: [preprocess({}), mdsvex({smartypants: true})],

  kit: {
    adapter: adapter({ precompress: true }),

  },
};

export default config;
