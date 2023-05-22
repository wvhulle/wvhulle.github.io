<script lang="ts">
	import range from 'lodash-es/range';
	import TimeSeries from './TimeSeries.svelte';
	const now = new Date(0);
	let data = range(0, 10000).map((n) => ({
		time: new Date(now.getTime() + n * 3600 * 1000 * 24 * 10),
		value: Math.sin(n / 1000)
	}));
</script>

<div>
	<TimeSeries window={10} {data} maxData={1} minData={0} />
</div>

<style>
	div {
		border: 2px solid red;
		width: 100%;
		height: 100%;
	}
</style>
