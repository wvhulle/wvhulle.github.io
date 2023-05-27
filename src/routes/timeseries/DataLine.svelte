<script lang="ts">
	import { extent } from 'd3';
	import { scaleLinear, scaleTime } from 'd3-scale';
	import { curveCatmullRom, line } from 'd3-shape';
	import isArray from 'lodash-es/isArray';
	import clamp from 'lodash-es/clamp';
	import isDate from 'lodash-es/isDate';
	import { draw } from 'svelte/transition';

	export let data: { x: Date; y: number }[];
	if (!data || !isArray(data)) {
		throw new Error(`Expected an array for the data`);
	}

	export let width: number;
	export let height: number;
	export let maxData: number = Math.max(...data.map(({ x }) => Number(x)));
	export let minData: number | undefined = Math.min(...data.map(({ y }) => Number(y)));

	$: margin = {
		bottom: Math.max(70, 0.1 * height),
		left: Math.max(70, 0.05 * width),
		right: Math.max(40, 0.05 * width),
		top: Math.max(40, 0.1 * height)
	};

	$: timeDomain = extent(data, ({ x }): number => x.getTime());

	$: dataDomain = extent(data, ({ y }) => clamp(y, minData!, maxData));

	// $: console.log(`xScale: ${JSON.stringify(xScale)}`)

	$: timeScale =
		timeDomain[0] !== undefined
			? scaleTime()
					.domain(timeDomain)
					.range([margin.left, width - margin.right])
					.nice()
			: undefined;

	$: dataScale =
		dataDomain[0] !== undefined
			? scaleLinear()
					.domain(dataDomain)
					.range([height - margin.bottom, margin.top])
					.nice()
			: undefined;

	$: path = line<{ x: Date; y: number }>()
		.x(({ x }) => {
			if (!isDate(x)) {
				throw Error(`Type of value is not a string.`);
			}

			if (timeScale === undefined) {
				throw Error(`x scale is not defined.`);
			}

			return timeScale(x);
		})
		.y(({ y }): number => {
			if (dataScale === undefined) {
				throw Error(`Y scale and header should have been defined.`);
			}
			return dataScale(y);
		})
		.curve(curveCatmullRom.alpha(0.5));

	$: svgDataPath = data.length > 0 ? path(data) : undefined;
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<g id="data-line">
	{#if svgDataPath}
		{#if svgDataPath.includes('NaN')}
			<text>Invalid path</text>
		{:else}
			<path
				in:draw={{ delay: 200, duration: 100 }}
				class="smoothData"
				d={svgDataPath}
				fill="none"
			/>
		{/if}
	{:else}
		No data available.
	{/if}
</g>

<style>
	path.smoothData {
		stroke: black;
	}
</style>
