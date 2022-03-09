import cliProgress from "cli-progress";

const multibar = new cliProgress.MultiBar({
    format: 'Progress | {bar} | {percentage}% || {action} {value}/{total}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    clearOnComplete: false,
    stopOnComplete: true,
    hideCursor: true

}, cliProgress.Presets.shades_grey);

export default multibar;