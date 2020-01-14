const client = new dsteem.Client('https://anyx.io');
steem.api.setOptions({
	url: 'https://anyx.io'
});

// Checking if the already exists
async function checkAccountName(username) {
	const ac = await client.database.call('lookup_account_names', [[username]]);
	return (ac[0] === null) ? false : true;
}

function get_collection(player) {
	return new Promise(async function (resolve, reject) {
		axios.get("https://steemmonsters.com/cards/collection/" + player).then(function (response, error) {
			if (!error && response.status == 200) {
				let data = response.data;
				resolve(data.cards);
			} else {
				reject('get_collection error');
			}

		});

	});
}

async function start(account, postingKey, selection, to) {
	let collection = await get_collection(account);
	let extraCards = [];
	$('#log').val('');
	if (selection === 'extra') {
		extraCards = await getExtraCards(collection);
	} else {
		for (let i in collection) {
			if (collection[i].market_id === null) {
				extraCards.push(collection[i].uid);
			}
		}

	}
	if (extraCards.length > 0) {

		let log = await transferCards(account, postingKey, extraCards, to);
		logit($('#log'), log)
	} else {
		logit($('#log'), `${account} has no card to send!`);
	}

}

function getExtraCards(collection) {
	return new Promise(async function (resolve, reject) {
		let uniqueCards = [];
		let extraCards = [];
		for (let i in collection) {
			if (hasAdded(uniqueCards, collection[i].card_detail_id)) {
				if (collection[i].level == 1 && collection[i].market_id == null) {
					extraCards.push(collection[i].uid);
				}
			} else {
				uniqueCards.push(collection[i].card_detail_id)
			}

		}
		resolve(extraCards);
	});

}

//Check if the card has been added to the collection
function hasAdded(cards, card) {

	for (let i in cards) {
		if (cards[i] == card) {
			return true;
		}
	}
	return false;

}

function transferCards(account, postingKey, cards, to) {
	return new Promise(async function (resolve, reject) {
		var json = JSON.stringify({
				to: to,
				cards: cards
			});

		if (window.steem_keychain) {
			steem_keychain.requestCustomJson(account, 'sm_gift_cards', 'Posting', json, (err, result) => {
				if (err) {
					resolve(`Transfer failed:${err}`);
				} else {
					resolve(`${account} transferred ${cards.length} cards (${cards}) to ${to}`);
				}

			});
		} else {
			if(postingKey!=''){
			steem.broadcast.customJson(postingKey, [], [account], 'sm_gift_cards', json, (err, result) => {
				if (err) {
					resolve(`Transfer failed:${err}`);
				} else {
					resolve(`${account} transferred ${cards.length} cards (${cards}) to ${to}`);
				}

			});
			}else{
				resolve(`Please enter the Posting Key!`);
			}
		}

	});
}

function logit(dom, msg) {
	if ((msg == undefined) || (msg == null) || (msg == '')) {
		return;
	}
	var d = new Date();
	var n = d.toLocaleTimeString();
	var s = dom.val();
	dom.val((s + "\n" + n + ": " + msg).trim());
}

function clearSelection(tokens) {
	return new Promise(async function (resolve, reject) {
		let length = tokens.options.length;
		for (i = 0; i < length; i++) {
			tokens.options[i] = null;
		}
		resolve(tokens);
	});

}

$('#transfer').submit(async function (e) {
	e.preventDefault();
	const username = $("#username").val().trim();
	const postingKey = $('#posting-key').val().trim();
	const to = $("#to").val().trim();
	const selection = $("#selection").val();
	if (steem.utils.validateAccountName(username) !== null) {
		alert('Invalid Steem ID');
		$("#username").focus();
		return;
	}

	let validAccount = await checkAccountName(to);
	if (validAccount) {
		start(username, postingKey, selection, to);
	} else {
		logit($('#log'), username + " is an invalid steem ID");
	}

});
