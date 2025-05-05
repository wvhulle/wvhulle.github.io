# Homepage of Willem Vanhulle

Personal website of Willem Vanhulle, served at [GitHub pages](https://willemvanhulle.tech/).

To preview, install `zola`.

```bash
zola serve
```

Templating in [./templates](./templates/) with [Tera](https://keats.github.io/tera/docs/).

## Helix

The standard editor Helix used for this project needs some configuration.

Markdown language server is [`marksman`](https://github.com/artempyanykh/marksman). It is automatically used by Helix if it is in the path.

Markdown formatter should be installed: [`dprint`](https://dprint.dev/).

Configure the formatter in `~/.config/helix/languages.toml`:

```toml
[[language]]
name = "markdown"
formatter = { command = "dprint", args = ["fmt", "--stdin", "md"] }
auto-format = true
```
