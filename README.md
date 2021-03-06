# Homepage Documentation


## Initialize

Start a new svelte repository.

```
pnpm init @svelte-add/kit@latest
```

Choose `typescript` and `tailwind`. The rest is optional.
## Install dependencies

Install all the packages:

```
pnpm install
```

When using other `npm` libraries, use `pnpm i -D [name]` to save the dependency. 

## Write `.svelte`

Just write in the `src/routes` folder, `.svelte` with client-side javascript.

Important:

- Use absolute urls in `href` html properties and 
- use `rel=external` when linking files from the `static` directory (see [svelte kit anchor options](https://kit.svelte.dev/docs#anchor-options-rel-external)).
## Install adapter

Install the static adapter as mentioned in  https://kit.svelte.dev/docs#adapters-supported-environments
```
pnpm install -D @sveltejs/adapter-static@next
```




## Configure build

Adjust `svelte.config.js` to contain

```
import adapter from '@sveltejs/adapter-static';
```
and specify a build directory

`adapter({pages: "docs"})`

Change in the repository's settings, the Github Pages folder to `docs`. Add `.nojekyll` to `static/` to prevent Jekyll from generating a static site.

Install everything with `pnpm install`

## Build

Run `pnpm run build` to compile the static `html`, `css` and `js` files in the `docs/` folder


## Commit

Make sure you have a `.gitignore` file with `node_modules.
Add the Github repository as a remote.


Every time you run a build, commit the changes in the docs folder.

`git add docs/*`

`git commit -m "docs"`

## Deploy

`git push`

