#Inventory & Order Processing System
## Project Description
This project is a backend system for inventory and order processing. It manages:
product catalog, track inventory level, and enable product restock. 
- Initially product are initialized by zero stock
- `process_order`: place an order and stock order items that are out of stock, for future processing.
- `process_restock`: update the product stock, and re-`process_order` that are marked as pending. 
- `ship_package`: print the package ready for shipping in the console. The maximum package size is 1.8kg = 1800g

## Why TypeScript?
I choose typescript for this project because it is faster to step up, inline with my current stack without necessary installing extra tools, and it provide strong typing and modern language feature on top of Javascript.

I have also added extract features (out of the requirement) such as unit test with [jest](https://jestjs.io/) and GitHub action to 
automate my CI/CD. 
## Getting Started

Install [nvm](https://github.com/nvm-sh/nvm) for easy NodeJs installation:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
```
Install Node.js (recommended version): at the root directory of the project, run bellow command
```bash
nvm install
```
Ensure that yarn is installed
```bash
npm install -g yarn
```
Ensure that project dependencies are installed 
```bash
yarn install
```

## Running the Project

To start the application, use:

  ```bash
  ./run.sh
  ```
  or
  ```bash
  ./src/index.ts
  ```
  
## Available Scripts
```bash
 yarn test # run the test
 yarn start  # run the application
```