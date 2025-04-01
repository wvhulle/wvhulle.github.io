# Homepage of Willem Vanhulle

Personal website of Willem Vanhulle, served at [GitHub pages](https://wvhulle.github.io/).

## Slides

To present one of the presentations in markdown format, you can use [presenterm](https://mfontanini.github.io/presenterm/):

```bash
cargo install presenterm
presenterm posts/streams.md
```

Configure a nice font like `Fira Code` if you want to see pretty arrows in the terminal.


## Handouts

Install Typst.


```bash
pandoc posts/streams.md --pdf-engine=typst -o ~/streams.pdf
```