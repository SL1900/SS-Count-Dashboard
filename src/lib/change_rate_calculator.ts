    // let max_diff = 0;
    // let min_diff = 100000000;
    // let SLICE_SIZE = 200;
    // let COLORS = {
    //     RED: [255,0,0],
    //     GREEN: [0,255,0],
    //     BLUE: [0,0,255]
    // };
    //
    // let TEMPERATURE = (new Array(values.length)).fill("black");
    //
    // for(let i = 0; i < timestamps.length; i++) {
    //     let slice = timestamps.slice(Math.max(25,i-SLICE_SIZE/2), Math.min(timestamps.length - 1, i+SLICE_SIZE/2)).map(v=>+v);
    //     let diff = Math.max(...slice) - Math.min(...slice);
    //     if(max_diff < diff) max_diff = diff;
    //     if(min_diff > diff) min_diff = diff;
    // }
    // for(let i = 0; i < timestamps.length; i++) {
    //     let slice = timestamps.slice(Math.max(25,i-SLICE_SIZE/2), Math.min(timestamps.length - 1, i+SLICE_SIZE/2)).map(v=>+v);
    //     // let diff = Math.max(...slice) - Math.min(...slice);
    //     let diff = slice[slice.length - 1] - slice[0];
    //     // console.log(slice)
    //
    //     let percent = (diff - min_diff) / (max_diff - min_diff);
    //     // let percent = (diff - min_diff) / (max_diff - min_diff);
    //
    //     // console.log(diff, min_diff, max_diff, percent)
    //
    //     let color = pickHex(COLORS.GREEN, COLORS.RED, percent);
    //     // console.log("#" + color.join(""), diff, max_diff, percent)
    //
    //     //@ts-ignore
    //     // chart.config.data.datasets[0]["borderColor"][i] = "#" + color.join("");
    //     //@ts-ignore
    //     // chart.config.data.datasets[0]["backgroundColor"][i] = "#" + color.join("");
    //     //@ts-ignore
    //     // chart.config.data.datasets[0]["borderColor"][i] = "#00ff00";
    //
    //     // TEMPERATURE[i] = "#" + color.join("");
    //     // console.log(`rgb(${color[0]},${color[1]},${color[2]}) -- ${percent}`);
    //     TEMPERATURE[i] = `rgb(${color[0]},${color[1]},${color[2]})`;
    // }
    function pickHex(color1: number[], color2: number[], weight: number) {
        var w1 = weight;
        var w2 = 1 - w1;
        var rgb = [Math.round(color1[0] * w1 + color2[0] * w2),
        Math.round(color1[1] * w1 + color2[1] * w2),
        Math.round(color1[2] * w1 + color2[2] * w2)];
        // return rgb.map(e=>e.toString(16).padStart(2,"0"));
        return rgb.map(e=>e.toString());
    }
