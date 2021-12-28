<script>
	import '../app.css';
</script>

<div class="m-10 grid  place-content-center">
	<slot />
</div>
;

<style global lang="postcss">
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
</style>
