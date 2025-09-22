var numSelected = null;
var tileSelected = null;
var errors = 0;
var timerInterval;
var seconds = 0;

var undoStack = [];
var redoStack = [];

var boards = {
    easy: [
        [
            "--9748---",
            "7--1-2-9-",
            "2-34---8-",
            "-53--9---",
            "-----7-54",
            "-61--83--",
            "8--2-7-13",
            "-9-6-5-7-",
            "---48--2-"
        ],
        [
            "-3-6-2-9-",
            "6--3-1-7-",
            "--94--5--",
            "--8---1--",
            "4-------2",
            "--6---7--",
            "--7--26--",
            "-1-5-4--9",
            "-5-9-8-3-"
        ]
    ],
    medium: [
        [
            "--74916-5",
            "2---6-3-9",
            "-----7-1-",
            "-586----4",
            "--3----9-",
            "--62--187",
            "9-4-7---2",
            "67-83----",
            "81--45---"
        ],
        [
            "-2--5----",
            "---4-1--9",
            "5--9--8--",
            "--9-73---",
            "4-----1-8",
            "---21-7--",
            "--7--8--4",
            "1--6-9---",
            "----7--2-"
        ]
    ],
    hard: [
        [
            "-1-6-----",
            "--9--3-5-",
            "38-------",
            "-3-7-5---",
            "-----9---",
            "--5---73-",
            "--2-1----",
            "9--3-----",
            "----47-6-"
        ],
        [
            "8--1-----",
            "--2-5----",
            "-----3-9-",
            "-7----2--",
            "--6---5--",
            "--4----1-",
            "-9-6-----",
            "----4-7--",
            "-----2--8"
        ]
    ]
};

var solutions = {
    easy: [
        [
            "619748235",
            "753182496",
            "283456781",
            "857619342",
            "392847154",
            "461253879",
            "845297613",
            "179635728",
            "536481927"
        ],
        [
            "831652794",
            "652349178",
            "794218536",
            "278463915",
            "419875362",
            "365921487",
            "987134625",
            "126597349",
            "543986213"
        ]
    ],
    medium: [
        [
            "387491625",
            "241568379",
            "569327418",
            "758619234",
            "123784596",
            "496253187",
            "934176852",
            "675832941",
            "812945763"
        ],
        [
            "923857641",
            "687431259",
            "514962837",
            "869573124",
            "472618593",
            "351249768",
            "297385416",
            "138624975",
            "645197382"
        ]
    ],
    hard: [
        [
            "712654398",
            "649873251",
            "385129674",
            "431765982",
            "278439165",
            "965218734",
            "527941836",
            "896347512",
            "143582967"
        ],
        [
            "853197246",
            "692458371",
            "174263598",
            "371689425",
            "286345719",
            "549721683",
            "928536174",
            "765814932",
            "431972856"
        ]
    ]
};

var currentBoard;
var currentSolution;

window.onload = function() {
    newGame();
}

function newGame() {
    clearInterval(timerInterval);
    seconds = 0;
    document.getElementById("timer").innerText = "00:00";

    errors = 0;
    document.getElementById("errors").innerText = errors;

    undoStack = [];
    redoStack = [];

    let difficulty = document.getElementById("difficulty").value;

    // Pick random puzzle for chosen difficulty
    let index = Math.floor(Math.random() * boards[difficulty].length);
    currentBoard = boards[difficulty][index];
    currentSolution = solutions[difficulty][index];

    document.getElementById("board").innerHTML = "";
    document.getElementById("digits").innerHTML = "";
    document.getElementById("win-message").innerText = "";

    setGame();

    timerInterval = setInterval(updateTimer, 1000);
}

function setGame() {
    for (let i = 1; i <= 9; i++) {
        let number = document.createElement("div");
        number.id = i;
        number.innerText = i;
        number.addEventListener("click", selectNumber);
        number.classList.add("number");
        document.getElementById("digits").appendChild(number);
    }

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            let tile = document.createElement("div");
            tile.id = r.toString() + "-" + c.toString();
            if (currentBoard[r][c] != "-") {
                tile.innerText = currentBoard[r][c];
                tile.classList.add("tile-start");
            }
            if (r == 2 || r == 5) tile.classList.add("horizontal-line");
            if (c == 2 || c == 5) tile.classList.add("vertical-line");
            tile.addEventListener("click", selectTile);
            tile.classList.add("tile");
            document.getElementById("board").append(tile);
        }
    }
}

function selectNumber() {
    if (numSelected != null) numSelected.classList.remove("number-selected");
    numSelected = this;
    numSelected.classList.add("number-selected");
}

function selectTile() {
    if (numSelected) {
        if (this.innerText != "") return;

        let coords = this.id.split("-");
        let r = parseInt(coords[0]);
        let c = parseInt(coords[1]);

        if (currentSolution[r][c] == numSelected.id) {
            this.innerText = numSelected.id;
            this.classList.add("correct");
            undoStack.push({ tile: this, value: numSelected.id });
            redoStack = [];
            checkWin();
        } else {
            this.classList.add("wrong");
            setTimeout(() => this.classList.remove("wrong"), 500);
            errors += 1;
            document.getElementById("errors").innerText = errors;
        }
    }
}

function giveHint() {
    let emptyTiles = [];
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            let tile = document.getElementById(r + "-" + c);
            if (tile.innerText == "") emptyTiles.push({ r, c, tile });
        }
    }

    if (emptyTiles.length > 0) {
        let randomTile = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
        let correctValue = currentSolution[randomTile.r][randomTile.c];
        randomTile.tile.innerText = correctValue;
        randomTile.tile.classList.add("correct");
        undoStack.push({ tile: randomTile.tile, value: correctValue });
        redoStack = [];
        checkWin();
    }
}

function undoMove() {
    if (undoStack.length > 0) {
        let lastMove = undoStack.pop();
        redoStack.push(lastMove);
        lastMove.tile.innerText = "";
    }
}

function redoMove() {
    if (redoStack.length > 0) {
        let move = redoStack.pop();
        move.tile.innerText = move.value;
        undoStack.push(move);
    }
}

function solveBoard() {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            let tile = document.getElementById(r + "-" + c);
            tile.innerText = currentSolution[r][c];
            tile.classList.add("correct");
        }
    }
    clearInterval(timerInterval);
    document.getElementById("win-message").innerText = "✅ Puzzle Solved!";
}

function checkWin() {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            let tile = document.getElementById(r + "-" + c);
            if (tile.innerText != currentSolution[r][c]) return;
        }
    }
    clearInterval(timerInterval);
    document.getElementById("win-message").innerText = "🎉 Congratulations! You solved the Sudoku!";
}

function updateTimer() {
    seconds++;
    let min = Math.floor(seconds / 60);
    let sec = seconds % 60;
    document.getElementById("timer").innerText =
        (min < 10 ? "0" : "") + min + ":" + (sec < 10 ? "0" : "") + sec;
}

function changeTheme(color) {
    document.body.style.backgroundColor = color;
}
