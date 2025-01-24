<script lang="ts">
    import { CategoryScale, Chart, LinearScale, LineController, LineElement, PointElement, TimeScale, Tooltip } from "chart.js";
    import "chartjs-adapter-luxon";
    import ChartDataLabels from "chartjs-plugin-datalabels";
    import { onMount } from "svelte";
    import RangeSlider from "svelte-range-slider-pips";
    import { FormatTimestamp } from "$lib/utils";
    import MultiSelect from "$lib/components/MultiSelect.svelte";

    let ctx: CanvasRenderingContext2D;
    let chartCanvas: HTMLCanvasElement;

    let data: {content: string, timestamp: number, author: string}[];
    let timestamps: number[] = [];
    let labels: string[] = [];
    let values: number[] = [];
    let authors: string[] = [];

    export let data_loaded = false;

    //Time slider
    let slider_values = [0,0];
    let slider_min = 0;
    let slider_max = 0;

    let chart: Chart;
    function UpdateData(from: number = 0, to: number = 0, each: number = 3) {
        let data_part = data.filter(m=>{
            return ( +(new Date(m.timestamp)) > from && +(new Date(m.timestamp)) < (to || Number.POSITIVE_INFINITY))
        ;});

        let data_length = data_part.length;
        if(data_length < 5000) each = 1;
        else if(data_length <= 10000) each = 2;
        else if(data_length <= 20000) each = 4;
        else if(data_length <= 30000) each = 8;
        else if(data_length <= 40000) each = 16;
        else if(data_length <= 50000) each = 32;
        else each = 64;

        data_part = data_part.filter(m=>{
            return ((+m.content % each == 0) || (+m.content % 1000 == 0));
        });


        let temp_l: string[] = new Array(data_part.length);
        let temp_t: number[] = new Array(data_part.length);
        let temp_v: number[] = new Array(data_part.length);
        let temp_a: string[] = new Array(data_part.length);

        data_part.map((m, i) => {
            temp_l[i] = (new Date(m.timestamp)).toISOString();
            temp_t[i] = +(new Date(m.timestamp));
            temp_v[i] = +m.content;
            temp_a[i] = m.author;
        });

        labels = temp_l;
        timestamps = temp_t;
        values = temp_v;
        authors = temp_a;
    }

    let last_chart_update = 0;
    let chart_update_debounce_time = 100;
    $: {
        slider_values;
        if(data && (Date.now() - last_chart_update) > chart_update_debounce_time) {
            last_chart_update = Date.now();

            UpdateData(slider_values[0], slider_values[1]);
            UpdateCrosses();
            chart.data.datasets[0].data = values;
            // //@ts-ignore
            chart.data.labels = labels;
            chart.update();
        }
    }
    function UpdateCrosses() {
        //@ts-ignore
        for(let i = 0; i < chart.config.data.datasets[0]["pointStyle"].length; i++) {
            let isCross = +values[i] % 1000 == 0;

                //@ts-ignore
                chart.config.data.datasets[0]["pointStyle"][i] = isCross ? "cross" : "circle";
                //@ts-ignore
                chart.config.data.datasets[0]["pointRadius"][i] = isCross ? 10 : 1;
        }
    }

    onMount(async () => {
        let data_request = await (await fetch("/total_messages.json")).json();
        data_loaded = true;

        data = data_request;

        UpdateData();

        let slider_days_start = Math.floor(timestamps[0] / (24 * 60 * 60 * 1000));
        let slider_days_end = Math.ceil(timestamps[timestamps.length - 1] / (24 * 60 * 60 * 1000));

        slider_min = slider_days_start * 24 * 60 * 60 * 1000;
        slider_max = slider_days_end * 24 * 60 * 60 * 1000;

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

<style>
    .canvas-container {
        aspect-ratio: 2;
    }
    :global(#time-slider .pipVal) {
        writing-mode: vertical-lr;
        transform: rotate(180deg) translate(50%, -5%);
        font-size: 0.85rem;
    }
</style>
