<script lang="ts">
    import Chart from "chart.js/auto";
    import "chartjs-adapter-luxon";
    import ChartDataLabels from "chartjs-plugin-datalabels";
    // import "chartjs-plugin-zoom";
    import { onMount } from "svelte";

    import data from "../total_messages.json";

    // let labels = data.map(m=>m.timestamp.slice(0,10).replaceAll("-", ".")).reverse();
    // let labels = data.map(m=>m.timestamp).reverse();
    let labels = data.map(m=>(new Date(m.timestamp)).toISOString() ).reverse();
    let timestamps = data.map(m=>+(new Date(m.timestamp))).reverse();
    let values = data.map(m=>m.content).reverse();
    let authors = data.map(m=>m.author).reverse();

    let ctx: CanvasRenderingContext2D;
    let chartCanvas: HTMLCanvasElement;

    let special_numbers: {author: string, value: number}[] = [];
    
    onMount(async () => {
        UpdateSpecial();

        let max_diff = 0;
        let min_diff = 100000000;
        let SLICE_SIZE = 200;
        let COLORS = {
            RED: [255,0,0],
            GREEN: [0,255,0],
            BLUE: [0,0,255]
        };

        let TEMPERATURE = (new Array(values.length)).fill("black");

        for(let i = 0; i < timestamps.length; i++) {
            let slice = timestamps.slice(Math.max(25,i-SLICE_SIZE/2), Math.min(timestamps.length - 1, i+SLICE_SIZE/2)).map(v=>+v);
            let diff = Math.max(...slice) - Math.min(...slice);
            if(max_diff < diff) max_diff = diff;
            if(min_diff > diff) min_diff = diff;
        }
        for(let i = 0; i < timestamps.length; i++) {
            let slice = timestamps.slice(Math.max(25,i-SLICE_SIZE/2), Math.min(timestamps.length - 1, i+SLICE_SIZE/2)).map(v=>+v);
            // let diff = Math.max(...slice) - Math.min(...slice);
            let diff = slice[slice.length - 1] - slice[0];
            // console.log(slice)

            let percent = (diff - min_diff) / (max_diff - min_diff);
            // let percent = (diff - min_diff) / (max_diff - min_diff);

            console.log(diff, min_diff, max_diff, percent)

            let color = pickHex(COLORS.GREEN, COLORS.RED, percent);
            // console.log("#" + color.join(""), diff, max_diff, percent)

            //@ts-ignore
            // chart.config.data.datasets[0]["borderColor"][i] = "#" + color.join("");
            //@ts-ignore
            // chart.config.data.datasets[0]["backgroundColor"][i] = "#" + color.join("");
            //@ts-ignore
            // chart.config.data.datasets[0]["borderColor"][i] = "#00ff00";

            // TEMPERATURE[i] = "#" + color.join("");
            // console.log(`rgb(${color[0]},${color[1]},${color[2]}) -- ${percent}`);
            TEMPERATURE[i] = `rgb(${color[0]},${color[1]},${color[2]})`;
        }

        ctx = chartCanvas.getContext("2d") as CanvasRenderingContext2D;
        Chart.register(ChartDataLabels);

        let chart = new Chart(ctx, {
            type: "line",
            data: {
                labels,
                datasets: [{
                    label: "count",
                    data: values,
                    pointRadius: 10,
                    yAxisID: "y1",
                    pointStyle: (new Array(values.length)).fill(false),
                    // borderColor: (new Array(values.length)).fill(false),
                    borderWidth: 1,
                    // backgroundColor: (new Array(values.length)).fill(null),
                    // borderColor: (context) => {
                    //     const chart = context.chart;
                    //     const {ctx, chartArea} = chart;
                    //
                    //     if(!chartArea) { return; }
                    //
                    //     let gradient;
                    //     gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
                    //     for(let i = 0; i < TEMPERATURE.length; i = i + 1000) {
                    //         //
                    //         gradient.addColorStop(i / TEMPERATURE.length, TEMPERATURE[i]);
                    //     }
                    //
                    //     return gradient;
                    // }
                },
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                resizeDelay: 100,
                onResize(chart, size) {
                    chart.resize();
                },
                scales: {
                    x: { type: "time" },
                    y1: { ticks: { stepSize: 100 }, position: "left" },
                    y2: { ticks: { stepSize: 100 }, position: "right", grid: { drawOnChartArea: false } },
                },
                plugins: {
                    datalabels: {
                        align: "left",
                        formatter: function(value, context) {
                            return (context.dataset.data[context.dataIndex] as number || 0) % 1000 == 0 ? value : "";
                        }
                    },
                    // zoom: {
                    //     zoom: {
                    //         wheel: {
                    //             enabled: true
                    //         },
                    //     }
                    // }
                }
            }
        });

        for(let i = 0; i < values.length; i += 1000) {
            //@ts-ignore
            chart.config.data.datasets[0]["pointStyle"][i] = "cross";
        }
    });
    function pickHex(color1: number[], color2: number[], weight: number) {
        var w1 = weight;
        var w2 = 1 - w1;
        var rgb = [Math.round(color1[0] * w1 + color2[0] * w2),
        Math.round(color1[1] * w1 + color2[1] * w2),
        Math.round(color1[2] * w1 + color2[2] * w2)];
        // return rgb.map(e=>e.toString(16).padStart(2,"0"));
        return rgb.map(e=>e.toString());
    }

    function UpdateSpecial() {
        for(let i = 0; i < values.length; i++) {
            if(+values[i] % 1000 !== 0) continue;

            special_numbers.push({
                author: authors[i],
                value: Number.parseInt(values[i])
            });
        }
        //@ts-ignore
        special_numbers = special_numbers;
    }
</script>

<main class="flex max-h-screen p-4 flex-wrap">
    <!-- <div class="w-64 flex flex-col"> -->
    <!--     <div class="font-bold uppercase">List of special numbers</div> -->
    <!--     <table> -->
    <!--         <tbody> -->
    <!--             {#each special_numbers as sn} -->
    <!--                 <tr> -->
    <!--                     <td class="p-1 border-sky-800 border-2">{sn.author}</td> -->
    <!--                     <td class="p-1 border-sky-800 border-2">{sn.value}</td> -->
    <!--                 </tr> -->
    <!--             {/each} -->
    <!--         </tbody> -->
    <!--     </table> -->
    <!-- </div> -->
    <div class="canvas-container flex-[3_3_0%] w-full xl:w-1/2 relative border-2 border-sky-300 p-2 m-2">
        <canvas bind:this={chartCanvas}></canvas>
    </div>
    <iframe class="flex-1 min-h-96" title="KarmaSkeleton" src="https://docs.google.com/spreadsheets/d/e/2PACX-1vRdkxOhKVUS0H831xeSF4J5HLeMP-vcdNoDt6y64n3hHC1lVnuLhfD-iIyqKSlqQmMR4pSk7C-tWrFn/pubhtml?widget=true&amp;headers=false"></iframe>
</main>

<style>
    iframe {
        min-width: 30%;
    }
    .canvas-container {
        aspect-ratio: 2;
    }
</style>
