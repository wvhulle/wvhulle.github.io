<script lang="ts">
	import { extent } from "d3";
	import { scaleLinear } from "d3-scale";
	import clamp from "lodash-es/clamp";
	import { quintOut } from "svelte/easing";
	import { fade } from "svelte/transition";

	export let dataVariable: string | number | undefined = "y";
	export let data: { x: Date; y: number }[];

	export let width: number;
	export let height: number;
	export let maxData: number = Math.max(...data.map(({ y }) => Number(y)));
	export let minData: number = Math.min(...data.map(({ y }) => Number(y)));

	$: margin = {
		bottom: Math.max(70, 0.1 * height),
		left: Math.max(70, 0.05 * width),
		right: Math.max(40, 0.05 * width),
		top: Math.max(40, 0.1 * height),
	};

	$: yDomain = extent(data, ({ y }) => clamp(y, minData, maxData));

	// $: console.log(`xScale: ${JSON.stringify(xScale)}`)

	$: yScale =
		yDomain[0] !== undefined
			? scaleLinear()
					.domain(yDomain)
					.range([height - margin.bottom, margin.top])
					.nice()
			: undefined;

	$: yTicks = yScale?.ticks();

	$: yAxisPath = `M-6,${height - margin.bottom}
				H0
				V${margin.top}
				H-6`;
</script>

<g transform="translate({margin.left}, 0)">
	{#if yScale !== undefined}
		{@const midY = yScale((maxData + minData) / 2)}

		{#if midY}
			<text transform="translate(-50,{midY}) rotate(-90)">
				{dataVariable}
			</text>
		{:else}
			<text> Problem computing displacement of y scale. </text>
		{/if}
	{:else}
		No bounds for y axis.
	{/if}

	{#if yAxisPath.includes("NaN")}
		<text>Invalid y axis path</text>
	{:else}
		<path stroke="currentColor" d={yAxisPath} fill="none" />
	{/if}
	{#if yTicks && yScale}
		{#each yTicks as y, j (y)}
			<g
				in:fade={{
					delay: 200 + j * 150,
					duration: 600,
					easing: quintOut,
				}}
				class="tick"
				transform="translate(0,{yScale(y)})"
			>
				<line stroke="currentColor" x2="-5" />
				<text dy="0.32em" fill="currentColor" x="-20" text-anchor="end">
					{y}
				</text>
			</g>
		{/each}
	{:else}
		No y ticks available
	{/if}
</g>

<style>
	.tick {
		font-size: 11px;
	}
</style>
