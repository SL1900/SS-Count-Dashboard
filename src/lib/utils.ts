export function FormatTimestamp(timestamp: number, include_time: boolean = true) {
    let date = new Date(timestamp);

    let str = date.toLocaleString('en-us', {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });

    let result = str.replace(/(\d+)\/(\d+)\/(\d+)/, "$3-$1-$2");
    if(!include_time) result = result.slice(0, result.indexOf(","));

    return result;
}

