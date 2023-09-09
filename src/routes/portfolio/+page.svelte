<h1>Portfolio</h1>

<p>Large, successfully completed projects.</p>

<h2>Data structures</h2>

<h3>Reactive hashmaps</h3>
<p>
  This type of data structure is a <a
    href="https://en.wikipedia.org/wiki/Hash_table">hashmap</a
  >
  that consists of entries which can be iterated through and behaves as an
  <a href="https://rxjs.dev/guide/overview">RxJS array observable</a>. Although
  the keys are not reactive, the values of the map are and their values can be
  reverted to an initial value.
</p>

<p>
  An advancement of this is a recursive hashmap implementation which functions
  as a
  <a href="https://en.wikipedia.org/wiki/Tensor">tensor</a> allowing arbitrary objects
  to be used as indexes, such as database primary keys, instead of vectors of integers.
  Performance improvements for over 10000 nodes are still in progress, though it
  is already useful for complex interactive data grids of less than 1000 rows.
</p>

<h2>Frontend</h2>

<p>
  Forms library for CSV, FormData and JSON. Inline and block versions available.
</p>

<h2>Backend</h2>

<h3>Down-stream processing</h3>
<p>
  This project was made for the purification department of Inbiose, a
  microbiological lab in Ghent. It allows users to log process parameters and
  sample data in a structured way. Additionally, it can parse large data files
  to create reports.
</p>

<h3>RPC and Asynchronous PostgreSQL</h3>
<p>
  This system implements <a
    href="https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm"
    >Dijkstra's Algorithm</a
  >, <a href="https://en.wikipedia.org/wiki/WebSocket">WebSockets</a>, and
  asynchronous programming for routing across multiple nodes. It provides the
  ability to define procedures for both client and servers, allowing
  computations to be executed instantly when used with WebSocket. Robustness
  against network failure is currently being improved.
</p>
<h4>Related</h4>
<p>
  This project is similar to <a
    href="https://www.npmjs.com/package/rpc-websockets">RPC WebSockets</a
  >
  and <a href="https://www.npmjs.com/package/json-rpc-2.0">JSON-RPC</a>, but
  without broadcasting events.
</p>

<h2>Links:</h2>

<p>
  Open source public work can be found on <a href="https://github.com/wvhulle"
    >Github</a
  >
</p>
