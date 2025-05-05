// --- Existing Variables ---
var dealerSum: number = 0;
var mySum: number = 0;
var dealerAceCount: number = 0;
var myAceCount: number = 0;
var hidden: string;
var deck: string[];
var canHit: boolean = true; // allows me to draw while total is <= 21

// --- Betting Variables ---
let playerMoney: number = 500;
let currentBet: number = 0;
let isRoundInProgress: boolean = false; // Track if a round (after betting) has started

// --- DOM Element References ---
let playerMoneyDisplay: HTMLElement;
let currentBetDisplay: HTMLElement;
let chipButtonsContainer: HTMLElement;
let placeBetButton: HTMLButtonElement;
let resetBetButton: HTMLButtonElement;
let hitButton: HTMLButtonElement;
let stayButton: HTMLButtonElement;
let dealerCardsDiv: HTMLElement;
let myCardsDiv: HTMLElement;
let hiddenCardImg: HTMLImageElement;
let resultsDisplay: HTMLElement;
let dealerSumDisplay: HTMLElement;
let mySumDisplay: HTMLElement;

window.onload = function() {
    // Get DOM elements after the page loads
    playerMoneyDisplay = document.getElementById('player-money')!;
    currentBetDisplay = document.getElementById('current-bet')!;
    chipButtonsContainer = document.getElementById('chip-buttons')!;
    placeBetButton = document.getElementById('place-bet') as HTMLButtonElement;
    resetBetButton = document.getElementById('reset-bet') as HTMLButtonElement;
    hitButton = document.getElementById('hit') as HTMLButtonElement;
    stayButton = document.getElementById('stay') as HTMLButtonElement;
    dealerCardsDiv = document.getElementById('dealer-cards')!;
    myCardsDiv = document.getElementById('my-cards')!;
    hiddenCardImg = document.getElementById('hidden') as HTMLImageElement;
    resultsDisplay = document.getElementById('results')!;
    dealerSumDisplay = document.getElementById('dealer-Sum')!;
    mySumDisplay = document.getElementById('my-Sum')!;

    // Initial setup
    buildDeck();
    shuffleDeck();

    // Initialize displays
    updateMoneyDisplay();
    updateBetDisplay();

    // Set initial button states
    disableGameButtons(); // Disable hit/stay initially
    disableBetActions(); // Disable place/reset bet initially
    enableChipButtons(); // Enable chips

    // Add event listeners
    setupEventListeners();
}

// --- Event Listener Setup ---
function setupEventListeners() {
    // Chip buttons
    chipButtonsContainer.addEventListener('click', function(event) {
        const target = event.target as HTMLElement; // Type assertion
        if (target.classList.contains('chip')) {
            const value = parseInt(target.dataset.value || '0'); // Use || '0' for safety
            addChipToBet(value);
        }
    });

    // Reset Bet button
    resetBetButton.addEventListener('click', resetBet);

    // Place Bet button
    placeBetButton.addEventListener('click', placeBet);

    // Game buttons
    hitButton.addEventListener('click', hit);
    stayButton.addEventListener('click', stay);
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
}

function shuffleDeck() {
    for (let i = 0; i < deck.length; i++){
        let j = Math.floor(Math.random() * deck.length); //(0-1) * 52 => (0-51.9999)
        let temp = deck[i];
        deck[i] = deck[j];
        deck[j] = temp;
    }
}

// Renamed from startGame to dealInitialCards to better reflect its new role
function dealInitialCards() {
    // Reset game state variables for the new round
    dealerSum = 0;
    mySum = 0;
    dealerAceCount = 0;
    myAceCount = 0;
    canHit = true;
    isRoundInProgress = true; // Mark round as started

    // Clear previous cards and results
    dealerCardsDiv.innerHTML = '<img id="hidden" src="./cards/BackgroundRed.png">'; // Keep hidden card placeholder
    hiddenCardImg = document.getElementById('hidden') as HTMLImageElement; // Re-assign after clearing
    myCardsDiv.innerHTML = '';
    resultsDisplay.innerText = '';
    dealerSumDisplay.innerText = '';
    mySumDisplay.innerText = '';

    // Re-build and shuffle if deck is low (optional, good practice)
    if (deck.length < 10) { // Example threshold
        console.log("Deck low, reshuffling...");
        buildDeck();
        shuffleDeck();
    }

    // Deal Dealer's hidden card
    hidden = deck.pop()!; // Add '!' for non-null assertion
    dealerSum += getValue(hidden);
    dealerAceCount += checkAce(hidden);

    // Deal Dealer's visible card
    let cardImg = document.createElement("img");
    let card = deck.pop()!;
    cardImg.src = "./cards/" + card + ".png";
    dealerSum += getValue(card);
    dealerAceCount += checkAce(card);
    dealerCardsDiv.append(cardImg);
    // Don't show dealer sum until stay()

    // Deal Player's cards
    for (let i = 0; i < 2; i++) {
        let cardImg = document.createElement("img");
        let card = deck.pop()!;
        cardImg.src = "./cards/" + card + ".png";
        mySum += getValue(card);
        myAceCount += checkAce(card);
        myCardsDiv.append(cardImg);
    }

    mySumDisplay.innerText = reduceAce(mySum, myAceCount).toString(); // Show initial sum

    // Check for immediate Blackjack
    if (reduceAce(mySum, myAceCount) === 21) {
        // Check if dealer also has blackjack (push)
        if (reduceAce(dealerSum, dealerAceCount) === 21) {
            revealDealerCard(); // Show dealer card for the push
            handlePush();
        } else {
            handleBlackjack(); // Player wins with Blackjack
        }
        canHit = false; // Can't hit after blackjack
        isRoundInProgress = false; // Round ends immediately
        disableGameButtons(); // Disable hit/stay as round is over
    }
}

function hit() {
    if (!canHit || !isRoundInProgress) { // Only allow hit if allowed and round is active
        return;
    }

    let cardImg = document.createElement("img");
    let card = deck.pop()!;
    cardImg.src = "./cards/" + card + ".png";
    mySum += getValue(card);
    myAceCount += checkAce(card);
    myCardsDiv.append(cardImg);

    let currentReducedSum = reduceAce(mySum, myAceCount);
    mySumDisplay.innerText = currentReducedSum.toString(); // Update sum display

    if (currentReducedSum > 21) {
        canHit = false;
        // Player busts - end the round
        revealDealerCard(); // Show dealer card even on bust
        handleLoss();
        isRoundInProgress = false; // Mark round as ended
        disableGameButtons(); // Disable hit/stay as round is over
    }
}

function stay() {
    if (!isRoundInProgress) return; // Don't do anything if round isn't active

    canHit = false;
    isRoundInProgress = false; // Mark round as ended
    disableGameButtons(); // Disable hit/stay

    // Dealer's turn: hit until sum is 17 or more
    while (reduceAce(dealerSum, dealerAceCount) < 17) {
        let cardImg = document.createElement("img");
        let card = deck.pop()!;
        cardImg.src = "./cards/" + card + ".png";
        dealerSum += getValue(card);
        dealerAceCount += checkAce(card);
        dealerCardsDiv.append(cardImg);
    }

    dealerSum = reduceAce(dealerSum, dealerAceCount);
    mySum = reduceAce(mySum, myAceCount); // Ensure final sum is reduced

    revealDealerCard();

    // Determine winner and handle payout
    let message = "";
    if (mySum > 21) { // Should have been caught by hit(), but double-check
        message = "You Busted!"; // Message updated in handleLoss
        handleLoss();
    } else if (dealerSum > 21) {
        message = "Dealer Busts, You Win!"; // Message updated in handleWin
        handleWin();
    } else if (mySum == dealerSum) {
        message = "Push!"; // Message updated in handlePush
        handlePush();
    } else if (mySum > dealerSum) {
        message = "You Win!"; // Message updated in handleWin
        handleWin();
    } else if (mySum < dealerSum) {
        message = "You Lose!"; // Message updated in handleLoss
        handleLoss();
    }
}

function revealDealerCard() {
    hiddenCardImg.src = "./cards/" + hidden + ".png";
    dealerSumDisplay.innerText = reduceAce(dealerSum, dealerAceCount).toString(); // Show dealer sum now
}

function getValue(card: string): number {
    let data = card.split("-"); // "4-c" -> ["4", "C"]
    let value = data[0];

    if (isNaN(parseInt(value))) { // A J Q K
        if (value == "A") {
            return 11;
        }
        return 10;
    }

    return parseInt(value);
}

function checkAce(card: string): number {
    if (card[0] == "A") {
        return 1;
    }
    return 0;
}

function reduceAce(playerSum: number, playerAceCount: number): number {
    while (playerSum > 21 && playerAceCount > 0) {
        playerSum -= 10;
        playerAceCount -= 1;
    }
    return playerSum;
}

// --- Betting Functions ---
function addChipToBet(amount: number) {
    if (isRoundInProgress) return; // Don't allow betting mid-round

    if (playerMoney >= amount) {
        playerMoney -= amount;
        currentBet += amount;
        updateMoneyDisplay();
        updateBetDisplay();
        enableBetActions(); // Enable place/reset since bet > 0
    } else {
        alert("Not enough money!");
    }
}

function resetBet() {
    if (isRoundInProgress) return; // Don't allow betting mid-round

    playerMoney += currentBet;
    currentBet = 0;
    updateMoneyDisplay();
    updateBetDisplay();
    disableBetActions(); // Disable place/reset since bet is 0
}

function placeBet() {
    if (isRoundInProgress) return; // Don't allow betting mid-round

    if (currentBet > 0) {
        disableBetting(); // Disable chips, place bet, reset bet
        enableGameButtons(); // Enable hit/stay
        dealInitialCards(); // Start the actual game round here
    } else {
        alert("Please place a bet first!");
    }
}

// --- UI Update Functions ---
function updateMoneyDisplay() {
    playerMoneyDisplay.innerText = playerMoney.toString();
}

function updateBetDisplay() {
    currentBetDisplay.innerText = currentBet.toString();
}

// --- Button State Functions ---
function disableBetting() {
    disableChipButtons();
    disableBetActions();
}

function enableBetting() {
    enableChipButtons();
    if (currentBet > 0) {
        enableBetActions();
    } else {
        disableBetActions();
    }
    const chips = chipButtonsContainer.querySelectorAll('button.chip');
    chips.forEach(button => {
        const chipButton = button as HTMLButtonElement;
        const value = parseInt(chipButton.dataset.value || '0');
        chipButton.disabled = value > playerMoney;
    });
}

function disableChipButtons() {
    const chips = chipButtonsContainer.querySelectorAll('button.chip');
    chips.forEach(button => (button as HTMLButtonElement).disabled = true);
}

function enableChipButtons() {
    const chips = chipButtonsContainer.querySelectorAll('button.chip');
    chips.forEach(button => {
        const chipButton = button as HTMLButtonElement;
        const value = parseInt(chipButton.dataset.value || '0');
        chipButton.disabled = value > playerMoney;
    });
}

function disableBetActions() {
    placeBetButton.disabled = true;
    resetBetButton.disabled = true;
}

function enableBetActions() {
    placeBetButton.disabled = currentBet <= 0;
    resetBetButton.disabled = currentBet <= 0;
}

function disableGameButtons() {
    hitButton.disabled = true;
    stayButton.disabled = true;
}

function enableGameButtons() {
    hitButton.disabled = false;
    stayButton.disabled = false;
}

// --- Payout Logic ---
function handleWin() {
    let winnings = currentBet;
    playerMoney += currentBet + winnings;
    resultsDisplay.innerText = `You Win! +$${winnings}`;
    endRound();
}

function handleBlackjack() {
    let winnings = Math.floor(currentBet * 1.5);
    playerMoney += currentBet + winnings;
    resultsDisplay.innerText = `Blackjack! +$${winnings}`;
    const hiddenCardElement = document.getElementById("hidden") as HTMLImageElement | null;
    if (hiddenCardElement && !hiddenCardElement.src.includes("BACK")) {
       revealDealerCard();
    }
    endRound();
}

function handleLoss() {
    resultsDisplay.innerText = `You Lose! -$${currentBet}`;
    endRound();
}

function handlePush() {
    playerMoney += currentBet;
    resultsDisplay.innerText = "Push! Bet Returned";
    endRound();
}

function endRound() {
    currentBet = 0;
    isRoundInProgress = false;
    updateMoneyDisplay();
    updateBetDisplay();
    disableGameButtons();

    dealerSumDisplay.innerText = reduceAce(dealerSum, dealerAceCount).toString();
    mySumDisplay.innerText = reduceAce(mySum, myAceCount).toString();

    if (playerMoney <= 0) {
        resultsDisplay.innerText = "Game Over! You're out of money.";
        alert("Game Over! You're out of money.");
        disableBetting();
    } else {
         enableBetting();
    }
}
