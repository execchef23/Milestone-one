
var dealerSum = 0;
var mySum = 0;

var dealerAceCount = 0;
var myAceCount = 0;

var hidden;
var deck;

var canHit = true; //allows me to draw while total is <= 21

window.onload = function() {
    buildDeck();
    shuffleDeck();
    startGame();
}

function buildDeck() {
    let values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    let types = ['C', "D", "H", "S"];
    deck = []

    for (let i = 0; i < types.length; i++) {
        for (let j = 0; j < values.length; j++) {
            deck.push(values[j] + "-" + types[i]); //A-C -> K-C, A-D -> K-D, A-H -> K-H, A-S -> K-S
        }
    }
   // console.log(deck);
}

function shuffleDeck() {
    for (let i = 0; i < deck.length; i++){
        let j = Math.floor(Math.random() * deck.length); //(0-1) * 52 => (0-51.9999)
        let temp = deck[i];
        deck[i] = deck[j];
        deck[j] = temp;
    }
    console.log(deck);
}

function startGame() {
    hidden = deck.pop();
    dealerSum += getValue(hidden);
    dealerAceCount += checkAce(hidden);
    // console.log(hidden);
    // console.log(dealerSum);
    while (dealerSum < 17){
        //<img>
        let cardImg = document.createElement("img");
        let card = deck.pop();
        cardImg.src = "cards" + card + ".png";
        dealerSum += getValue(card);
        dealerAceCount += checkAce(card);
        document.getElementById("dealer-cards").append(cardImg);
    }
    //console.log(dealerSum);

    for (let i = 0; i < 2; i++) {
        let cardImg = document.createElement("img");
        let card = deck.pop();
        cardImg.src = "cards" + card + ".png";
        mySum += getValue(card);
        myAceCount += checkAce(card);
        document.getElementById("my-cards").append(cardImg); 
    }

    //console.log(mysum);
    document.getElementById("hit").addEventListener("click", hit);
    document.getElementById("stay").addEventListener("click", stay);

}

function hit() {
    if (!canHit) {
        return;
    }

    let cardImg = document.createElement("img");
        let card = deck.pop();
        cardImg.src = "cards" + card + ".png";
        mySum += getValue(card);
        myAceCount += checkAce(card);
        document.getElementById("my-cards").append(cardImg); 

        if (reduceAce(mySum, myAceCount) > 21) {
            canHit = false;
        }

}

function stay() {
    dealerSum = reduceAce(dealerSum, dealerAceCount);
    yourSum = reduceAce(mySum, myAceCount);

    canHit = false;
    document.getElementById("hidden").src = "cards" + hidden + ".png";

    let message = "";
    if (mySum > 21) {
        message = "You Lose :(";
    }
    
    else if (dealerSum > 21) {
        message = "You win!!!!!";
    }

    else if (mySum == dealerSum) {
        message = "Tie :(";
    }

    else if (mySum > dealerSum) {
        message = "You Win!!!!"
    }

    else if (mySum < dealerSum) {
        message = "You Lose :("
    }
    document.getElementById("dealer-Sum").innerText = dealerSum;
    document.getElementById("my-Sum").innerText = yourSum;
    document.getElementById("results").innerText = message;
}

function getValue(card) {
    let data = card.split("-"); // "4-c" -> ["4", "C"]
    let value = data[0];

    if (isNaN(value)) { //A J Q K
        if (value == "A") {
            return 11;
        }
        return 10;
    }
    
    return parseInt(value);
}

function checkAce(card) {
    if (card[0] == "A") {
        return 1;
    }
    return 0;
}
function reduceAce(playerSum, playerAceCount) {
    while (playerSum > 21 && playerAceCount > 0) {
        playerSum -= 10;
        playerAceCount -= 1;
    }
    return playerSum;
}