# 5 minute HTS token launch challenge

Intended to be used as a common starting point for demo repos for tutorials.

<a href="https://gitpod.io/?autostart=true&editor=code&workspaceClass=g1-standard#https://github.com/hedera-dev/five-minute-token-launch-challenge" target="_blank" rel="noreferrer">
  <img src="./img/gitpod-open-button.svg" />
</a>

## Features

- Script that makes it easy to launch your own fungible token on Hedera Token Service (HTS)
- ... Plus all of the features in [the Hedera Tutorial Demo Base Template](https://github.com/hedera-dev/hedera-tutorial-demo-base-template), which this extends from.

## Tutorial

### Video demo

[5 minute HTS token launch challenge](https://www.youtube.com/watch?v=hDQXV87FeG8&list=PLjyCRcs63y83i7c9A4UJxP8BYcTgpjqTJ) (watch on YouTube)

[![](https://img.youtube.com/vi/hDQXV87FeG8/maxresdefault.jpg)](https://www.youtube.com/watch?v=hDQXV87FeG8&list=PLjyCRcs63y83i7c9A4UJxP8BYcTgpjqTJ)

### Steps

1. Click on the "open in Gitpod" button to launch Gitpod
   1. If this is your first time using Gitpod,
      you'll need to create an account.
      It does not take long - it is as simple as signing in with Github,
      then authorising the Gitpod app.
1. Wait for Gitpod to spin up a new instance (takes under 10 seconds)
1. In the terminal, a script will prompt you to answer a few questions
   1. The newly generated accounts are derived from a seed phrase:
      Leave blank to generate a random one
   1. Number of accounts are derived from a seed phrase:
      Leave blank to accept the default
   1. RPC URL:
      Leave blank to accept the default
   1. Private key:
      Leave blank to accept the default, which is to use the first account generated earlier
      - Note that you may alternatively use the "HEX Encoded Private Key" of the "ECDSA Account"
        from [`portal.hedera.com`](https://portal.hedera.com/dashboard).
        This option requires a few extra minutes.
   1. Copy the address of the newly generated account to your clipboard
1. Visit [`faucet.hedera.com`](https://faucet.hedera.com/) in a new browser tab/window
   1. Note that if you have previously funded this particular account,
      you may skip the following steps
   1. Paste the address of your newly generated account from your clipboard
   1. Press the "receive" button
   1. Clear the captcha challenge
   1. Press the "confirm" button
   1. You should see a new account ID - this means that your account has been funded
1. Switch back to your Gitpod instance, and in the terminal continue answering the questions prompted by the script
   1. Simply hit the "enter" key, now that you have funded this account
   1. The script will automatically work out the account ID for you (no need to copy paste it)
1. In the file navigation pane, open the `.env` file to inspect the output of the script
1. In the file navigation pane, open the `src/script-5minHtsTokenLaunchChallenge.js` file to edit its contents
  1. Find the section `Configuring the new HTS token`.
     The should be a comment which reads:
     `// Set the token name, token symbol, and its initial supply (total number of tokens).`
  1. Modify the values in the next 3 lines as follows:
     1. Under it, change the value of `name` to the name that you
        wish to give your fungible token
     1. Change the value of `symbol` to the symbol that you wish to
        give your fungible token (this is typically an acronym or contraction of the name,
        and in all-caps, but that is up to you)
     1. Finally, change the value of `initialSupply` to some large number,
        as this will be the total circulating supply of your token upon creation
1. In the terminal, enter the command `cd src`
1. In the terminal, run the following script: `./script-5minHtsTokenLaunchChallenge.js`
   1. Shortcut: type `./script`, then hit the `[tab]` key to auto-complete
1. This script sends a `TokenCreateTransaction` to the network, with the options that you provided when editing it, to create your token
1. Copy the 2 Hashscan URLs from the terminal output, and open them in new browser tabs/windows
   1. For the transaction page, check that the transaction sent the tokens (the entire initial supply) to your account
   1. For the token page, check that its name, symbol, and initial supply match the values that you have configured

You're done - congratulations! 🎉

## Author

[Brendan Graetz](https://blog.bguiz.com/)

## Licence

MIT
