export function FormatTimestamp(timestamp: number) {
    let date = new Date(timestamp);

    let str = date.toLocaleString('en-us', {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });

    return str.replace(/(\d+)\/(\d+)\/(\d+)/, "$3-$1-$2");
}

