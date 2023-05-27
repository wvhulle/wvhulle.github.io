<svelte:head>
	<title>Home page of Willem Vanhulle</title>
</svelte:head>

<div class="w-full h-full prose mx-auto pb-5 pt-5">
	<h1 class="pb-0 mb-0">Welcome to the home page of Willem Vanhulle</h1>

	<div class="flex flex-row p-0 m-0">
		<h4 class="">Software engineer</h4>
		<div class="flex flex-grow" />
		<p class="">living in Ghent, Belgium</p>
	</div>

	<h2>Background</h2>
	<p>
		I grew up in Bruges, Belgium and studied mathematics and computer science in Brussels and
		Leuven. I have taken courses on statistics, neural networks and physics. I'm actively involved
		in language exchange, dancing and intercultural communities.
	</p>

	<div>
		<h2>Skills</h2>
		<p>
			I'm currently employed but open for interesting side-projects related to web and app
			development.
		</p>

		<h3>Data Visualization</h3>
		<p>
			For data visualization projects, I use technologies such as <a
				href="https://en.wikipedia.org/wiki/D3.js">D3.js</a
			>, <a href="https://en.wikipedia.org/wiki/SVG">SVG</a> and
			<a href="https://svelte.dev/">Svelte</a>, taking inspiration from world-renown visualizations
			designer <a href="https://www.matthiasstahl.com/">Matthias Stahl</a>.
		</p>

		<h3>Database Design and Management</h3>
		<p>
			My expertise extends to <a href="https://www.postgresql.org/">PostgreSQL</a> and
			<a href="https://www.prisma.io/">Prisma</a> in terms of database design and management.
		</p>

		<h3>Web Servers and Protocols</h3>
		<p>
			I'm experienced with <a href="https://nodejs.org/en/">Node</a>, as well as
			<a href="https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API">WebSocket</a> for web
			servers and protocols.
		</p>
	</div>
	<div>
		<h2>Large projects</h2>

		<h3>Down-stream processing</h3>
		<p>
			This project was made for the purification department of Inbiose, a microbiological lab in
			Ghent. It allows users to log process parameters and sample data in a structured way.
			Additionally, it can parse large data files to create reports. The following user interface
			components are featured in this system: <span class="badge">time series</span>,
			<span class="badge">data grid</span>, and <span class="badge">CSV</span>.
		</p>

		<h3>RPC and Asynchronous PostgreSQL</h3>
		<p>
			This system implements <a href="https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm"
				>Dijkstra's Algorithm</a
			>, <a href="https://en.wikipedia.org/wiki/WebSocket">WebSockets</a>, and asynchronous
			programming for routing across multiple nodes. It provides the ability to define procedures
			for both client and servers, allowing computations to be executed instantly when used with
			WebSocket. Robustness against network failure is currently being improved.
		</p>
		<h4>Related</h4>
		<p>
			This project is similar to <a href="https://www.npmjs.com/package/rpc-websockets"
				>RPC WebSockets</a
			>
			and <a href="https://www.npmjs.com/package/json-rpc-2.0">JSON-RPC</a>, but without
			broadcasting events.
		</p>

		<h3>Reactive hashmaps</h3>
		<p>
			This type of data structure is a <a href="https://en.wikipedia.org/wiki/Hash_table">hashmap</a
			>
			that consists of entries which can be iterated through and behaves as an
			<a href="https://rxjs.dev/guide/overview">RxJS array observable</a>. Although the keys are not
			reactive, the values of the map are and their initial values can be reverted.
		</p>

		<p>
			An advancement of this is a recursive hashmap implementation which functions as a
			<a href="https://en.wikipedia.org/wiki/Tensor">tensor</a> allowing arbitrary objects to be used
			as indexes, such as database primary keys, instead of vectors of integers. Performance improvements
			for over 10000 nodes are still in progress, though it is already useful for complex interactive
			data grids of less than 1000 rows.
		</p>

		<h3>Node multicore app and build environment manager</h3>
		<p>
			For libraries such as Prisma and SvelteKit which require custom builds, this project provides
			a scheduler to run apps in parallel at runtime and make sure environment variables are set
			appropriately.
		</p>
		<h4>Related</h4>
		<p>
			To further understand the concept, take a look at data structure libraries using RxJS. The
			theory of relativistic programming may also be relevant; see <a
				href="https://www.usenix.org/legacy/event/atc11/tech/final_files/Triplett.pdf"
				>relativistic programming</a
			> for more information.
		</p>
	</div>
	<div>
		<h2>Hobby projects</h2>

		<h3>Molecular dynamics simulator</h3>

		<p>
			Hobby project inspired by statistical mechanics teacher Enrico Carlon. Simulates interactions
			between charged molecules and has tunable parameters.
		</p>

		<h3>Arithmetic problem sheet generator</h3>

		<p>
			Tool to assist in teaching arithmetic at Tweedekansonderwijs, Leuven. Generates problems that
			can be solved by hand for students using a given set of operations, together with a solutions
			set.
		</p>
	</div>
	<div>
		<h3>Links:</h3>
		<ul class="">
			<li>
				<a
					href="https://wvhulle.github.io/Willem_Vanhulle_cv.pdf"
					type="application/pdf"
					rel="external">CV</a
				>
			</li>
			<li>
				<a href="https://github.com/wvhulle">Github</a>
			</li>
			<li>
				<a href="https://keybase.io/willemvanhulle">Key-Base</a>
			</li>
			<li>
				<a href="https://www.linkedin.com/in/willem-vanhulle-2657aa180/">LinkedIn</a>
			</li>
		</ul>
	</div>

	<div class="text-sm mt-6">
		To make your own page, see the <a href="https://github.com/wvhulle/wvhulle.github.io"
			>source code</a
		>.
	</div>
</div>
