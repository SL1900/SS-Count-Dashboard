<script lang="ts">
    import { CategoryScale, Chart, LinearScale, LineController, LineElement, PointElement, TimeScale, Tooltip } from "chart.js";
    import "chartjs-adapter-luxon";
    import ChartDataLabels from "chartjs-plugin-datalabels";
    import RangeSlider from "svelte-range-slider-pips";
    // import "chartjs-plugin-zoom";
    import { onMount } from "svelte";
    import { FormatTimestamp } from "$lib/utils";
    import MultiSelect from "$lib/components/MultiSelect.svelte";
    import { BarLoader } from "svelte-loading-spinners";

    let ctx: CanvasRenderingContext2D;
    let chartCanvas: HTMLCanvasElement;

    let data: {content: string, timestamp: number, author: string}[];
    let timestamps: number[] = [];
    let labels: string[] = [];
    let values: number[] = [];
    let authors: string[] = [];

    let data_loaded = false;

    //Time slider
    let slider_values = [0,0];
    let slider_min = 0;
    let slider_max = 0;

    let chart: Chart;

    function UpdateData(from: number = 0, to: number = 0, each: number = 3) {
        let data_part = data.filter(m=>{
            return ((+m.content % each == 0) || (+m.content % 1000 == 0)) &&
            ( +(new Date(m.timestamp)) > from && +(new Date(m.timestamp)) < (to || Number.POSITIVE_INFINITY))
        ;});

        labels = data_part.map(m=>(new Date(m.timestamp)).toISOString() );
        timestamps = data_part.map(m=>+(new Date(m.timestamp)));
        values = data_part.map(m=>+m.content);
        authors = data_part.map(m=>m.author);
    }

    let last_chart_update = 0;
    $: {
        slider_values;
        if(data && (Date.now() - last_chart_update) > 500) {
            last_chart_update = Date.now();

            let each = 3;
            if(values.length < 2000) each = 1;
            else if(values.length >= 2000 && values.length < 4000) each = 2;
            else if(values.length >= 4000 && values.length < 8000) each = 4;
            else if(values.length >= 8000) each = 8;

            UpdateData(slider_values[0], slider_values[1], each);
            UpdateCrosses();
            chart.data.datasets[0].data = values;
            // //@ts-ignore
            chart.data.labels = labels;
            chart.update();
        }
    }

    function UpdateCrosses() {
        //@ts-ignore
        chart.config.data.datasets[0]["pointStyle"] = (new Array(values.length)).fill("circle");
        //@ts-ignore
        chart.config.data.datasets[0]["pointRadius"] = (new Array(values.length)).fill(1);
        for(let i = 0; i < values.length; i++) {
            if(+values[i] % 1000 == 0) {
                //@ts-ignore
                chart.config.data.datasets[0]["pointStyle"][i] = "cross";
                //@ts-ignore
                chart.config.data.datasets[0]["pointRadius"][i] = 10;
            }
        }
    }

    onMount(async () => {
        let data_request = await (await fetch("/total_messages.json")).json();
        data_loaded = true;

        data = data_request;

        UpdateData();

        let slider_days_start = Math.floor(timestamps[0] / (24 * 60 * 60 * 1000));
        let slider_hours_end = Math.ceil(timestamps[timestamps.length - 1] / (60 * 60 * 1000));

        slider_min = slider_days_start * 24 * 60 * 60 * 1000;
        slider_max = slider_hours_end * 60 * 60 * 1000;

        slider_values = [slider_min, slider_max];

        ctx = chartCanvas.getContext("2d") as CanvasRenderingContext2D;
        Chart.register(ChartDataLabels);
        Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale);
        Chart.register(TimeScale, Tooltip);

        chart = new Chart(ctx, {
            type: "line",
            data: {
                labels: labels,
                datasets: [{
                    label: "count",
                    data: values,
                    pointRadius: (new Array(values.length)).fill(1),
                    yAxisID: "y1",
                    pointStyle: (new Array(values.length)).fill("circle"),
                    borderColor: "#36a2eb",
                    borderWidth: 1,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                resizeDelay: 100,
                onResize(chart, _) { chart.resize(); },
                scales: {
                    x: { type: "time" },
                    y1: { ticks: { stepSize: 100 }, position: "left" },
                    y2: { ticks: { stepSize: 100 }, position: "right", grid: { drawOnChartArea: false } },
                },
                plugins: {
                    datalabels: {
                        align: "left",
                        font: function(context) {
                            return { size: context.chart.width < 800 ? 8 : 12 }
                        },
                        formatter: function(value, context) {
                            return (context.dataset.data[context.dataIndex] as number || 0) % 1000 == 0 ? value : "";
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(item) {
                                let value = ["Count: " + values[item.dataIndex]];
                                value.push("Author: " + authors[item.dataIndex]);
                                return value;
                            }
                        }
                    }
                },
            }
        });

        UpdateCrosses();
    });

</script>

<svelte:head>
    <meta name="description" content="Graph of StellaSora official discord server #counting channel" >
</svelte:head>

<main class="main-element h-full overflow-x-hidden min-h-screen">
    <!-- HEADER -->
    <div class="w-full gap-3 text-center m-2 font-bold text-4xl page-title flex justify-center">
        <a href="http://discord.gg/hNDKSCuD8G">
            <div>StellaSora</div>
            <div class="text-xs flex justify-center under-text underline">discord server</div>
        </a>
        <div>-</div>
        <div>#counting</div>
    </div>

    <!-- MAIN CONTENT -->
    <div class="flex max-h-screen pr-2 pl-2 flex-wrap">
        {#if !data_loaded}
            <div class="bg-white flex justify-center items-center flex-[3_3_0%] w-full xl:w-1/2 relative border-2 border-sky-300 p-2 m-2">
                <BarLoader size="120" color="#6666ff" />
            </div>
        {/if}
        <div class="canvas-container {!data_loaded ? "hidden" : ""} bg-white flex-[3_3_0%] w-full xl:w-1/2 relative border-2 border-sky-300 p-2 m-2">
            <canvas bind:this={chartCanvas}></canvas>
            <div class="range-container flex flex-col">
                <div class="time-labels flex justify-between">
                    <div class="start_time">{FormatTimestamp(slider_values[0])}</div>
                    <div class="end_time">{FormatTimestamp(slider_values[1])}</div>
                </div>
                <RangeSlider
                    id="time-slider"
                    hoverable
                    all="label"
                    formatter={(v,i,p) => {
                        let date = new Date(v);
                        return v % 86400 == 0 ? 
                            `${date.getDate().toString().padStart(2, "0")}-${(date.getMonth()+1).toString().padStart(2, "0")}` 
                            : "";
                    }}
                    pips pipstep={4 * 24}
                    step={3_600_000 / 4}
                    range pushy
                    bind:values={slider_values}
                    min={slider_min}
                    max={slider_max}
                    springValues={{ stiffness: 0.15, damping: 1}}
                />
            </div>
            <!-- <div class="people-select flex"> -->
            <!--     <div class="text">People selected:</div> -->
            <!--     <MultiSelect options={[ -->
            <!--             { value: "opt1", text: "Option 1", selected: true}, -->
            <!--             { value: "opt2", text: "Option 2", selected: true}, -->
            <!--             { value: "opt3", text: "Option 3", selected: false}, -->
            <!--             { value: "opt4", text: "Option 4", selected: true}, -->
            <!--     ]} /> -->
            <!-- </div> -->
        </div>
        <iframe class="flex-1 min-h-96" title="KarmaSkeleton" src="https://docs.google.com/spreadsheets/d/e/2PACX-1vRdkxOhKVUS0H831xeSF4J5HLeMP-vcdNoDt6y64n3hHC1lVnuLhfD-iIyqKSlqQmMR4pSk7C-tWrFn/pubhtml?widget=true&amp;headers=false"></iframe>
    </div>
</main>

<style>
    iframe {
        min-width: 30%;
    }
    .canvas-container {
        aspect-ratio: 2;
    }

    @font-face {
        font-family: "krunch";
        src: url("/fonts/krunch_italic.ttf");
    }

    .page-title {
        font-family: "krunch";
    }
    .under-text {
        line-height: 0;
    }
    .main-element::after {
        content: "";
        position: absolute;
        /* inset: -50%; */
        inset: 0;
        --grid-color: #cccccc22;
        --grid-size: 20px;
        background-size: var(--grid-size) var(--grid-size);
        background-image: 
            repeating-linear-gradient(45deg, transparent calc(50% - 1px), var(--grid-color) 50%, transparent calc(50% + 1px), transparent),
            repeating-linear-gradient(-45deg, transparent calc(50% - 1px), var(--grid-color) 50%, transparent calc(50% + 1px), transparent)
        ;
        z-index: -1;
    }
    :global(#time-slider .pipVal) {
        writing-mode: vertical-lr;
        transform: rotate(180deg) translate(50%, -5%);
        font-size: 0.85rem;
    }
</style>
