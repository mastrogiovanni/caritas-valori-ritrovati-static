<script>
    import { onMount } from "svelte";

    export let name;

    let database = {};
    let currentClass = "-";
    let classes = [];
    let currentPage = 0;
    let pageSize = 10;

    let codes = [];
    let filteredCodes = [];
    let paginatedCodes = [];

    function CSVToArray(strData, strDelimiter) {
        // Check to see if the delimiter is defined. If not,
        // then default to comma.
        strDelimiter = strDelimiter || ",";

        // Create a regular expression to parse the CSV values.
        var objPattern = new RegExp(
            // Delimiters.
            "(\\" +
                strDelimiter +
                "|\\r?\\n|\\r|^)" +
                // Quoted fields.
                '(?:"([^"]*(?:""[^"]*)*)"|' +
                // Standard fields.
                '([^"\\' +
                strDelimiter +
                "\\r\\n]*))",
            "gi"
        );

        // Create an array to hold our data. Give the array
        // a default empty first row.
        var arrData = [[]];

        // Create an array to hold our individual pattern
        // matching groups.
        var arrMatches = null;

        // Keep looping over the regular expression matches
        // until we can no longer find a match.
        while ((arrMatches = objPattern.exec(strData))) {
            // Get the delimiter that was found.
            var strMatchedDelimiter = arrMatches[1];

            // Check to see if the given delimiter has a length
            // (is not the start of string) and if it matches
            // field delimiter. If id does not, then we know
            // that this delimiter is a row delimiter.
            if (
                strMatchedDelimiter.length &&
                strMatchedDelimiter !== strDelimiter
            ) {
                // Since we have reached a new row of data,
                // add an empty row to our data array.
                arrData.push([]);
            }

            var strMatchedValue;

            // Now that we have our delimiter out of the way,
            // let's check to see which kind of value we
            // captured (quoted or unquoted).
            if (arrMatches[2]) {
                // We found a quoted value. When we capture
                // this value, unescape any double quotes.
                strMatchedValue = arrMatches[2].replace(
                    new RegExp('""', "g"),
                    '"'
                );
            } else {
                // We found a non-quoted value.
                strMatchedValue = arrMatches[3];
            }

            // Now that we have our value string, let's add
            // it to the data array.
            arrData[arrData.length - 1].push(strMatchedValue);
        }

        // Return the parsed data.
        return arrData;
    }

    function toObjectList(array) {
        return array.map((value, index, array) => {
            let result = {};
            let j = 0;
            for (let key of array[0]) {
                result[key] = value[j];
                j++;
            }
            return result;
        });
    }

    async function loadData() {
        let response = await fetch("/Giacenza.xlsx - Dati.csv");
        let data = await response.text();
        return toObjectList(CSVToArray(data, ",")).slice(1);
    }

    async function loadImages() {
        let response = await fetch("/imgs.json");
        return await response.json();
    }

    onMount(async () => {
        let data = await loadData();
        let images = await loadImages();
        let result = {};
        for (let item of data) {
            let id = item["Cod. Art."];
            let image = images[id];
            result[id] = {
                image,
                ...item,
            };
            result[id]["Classe Merc."] = result[id]["Classe Merc."].slice(8);
        }
        database = result;
        codes = Object.keys(database);

        let classList = new Set();
        classList.add("-");
        codes.forEach((code) => {
            classList.add(database[code]["Classe Merc."]);
        });
        classes = Array.from(classList).sort();

        currentPage = 0;
    });

    // Filter codes based on the class selected
    $: {
        if (currentClass === "-") {
            filteredCodes = codes;
        } else {
            filteredCodes = codes
                .map((code) => {
                    return database[code];
                })
                .filter((item) => {
                    return item["Classe Merc."] === currentClass;
                })
                .map((item) => {
                    return item["Cod. Art."];
                });
        }
    }

    function prev() {
        if (currentPage > 0) {
            currentPage = currentPage - 1;
        }
    }

    function next() {
        if ((currentPage + 1) * pageSize < filteredCodes.length) {
            currentPage = currentPage + 1;
        }
    }

    $: {
        paginatedCodes = filteredCodes.slice(
            currentPage * pageSize, Math.min((currentPage + 1) * pageSize, filteredCodes.length)
        );
    }
</script>

<div class="d-flex">
    <div class="justify-content-start"><button on:click={prev}>&nbsp;&nbsp;&nbsp;&lt;&nbsp;&nbsp;&nbsp;</button></div>
    <div class=""><button on:click={next}>&nbsp;&nbsp;&nbsp;>&nbsp;&nbsp;&nbsp;</button></div>
    <div class="flex-grow-1">
        <select
            bind:value={currentClass}
            class="form-select"
            aria-label="Default select example"
        >
            {#each classes as clazz (clazz)}
                <option selected={currentClass === clazz} value={clazz}
                    >{clazz}</option
                >
            {/each}
        </select>
    </div>
</div>

<div class="row">
    {#each paginatedCodes as code (code)}
        <div class="col" style="border:solid 1px hsla(0, 95%, 35%, 1);">
            <div class="row" style="padding: 20px;">
                <span class="badge rounded-pill bg-success" on:click={() => {
                    currentClass =
                        database[code]["Classe Merc."];
                }}>{database[code]["Classe Merc."]}</span>
            </div>
            <div class="row">
                <div class="col">
                    <div
                        class="thumb"
                        style={database[code].image ? "background-image: url('/imgs/" + database[code].image + "')" : ""}
                        />
                </div>
                <div class="col">
                    <p>{database[code]["Descrizione"]}</p>
                    <p>{database[code]["PPC"]} &euro;</p>
                    <p>{database[code]["Giacenza"]} rimanenti</p>
                </div>
            </div>
        </div>
    {/each}
</div>

<style>
    .thumb {
        display: inline-block;
        width: 200px;
        height: 200px;
        margin: 5px;
        border: 3px solid #c99;
        background-position: center center;
        background-size: cover;
    }

    main {
        text-align: center;
        padding: 1em;
        max-width: 240px;
        margin: 0 auto;
    }

    h1 {
        color: #ff3e00;
        text-transform: uppercase;
        font-size: 4em;
        font-weight: 100;
    }

    @media (min-width: 640px) {
        main {
            max-width: none;
        }
    }

   
</style>
