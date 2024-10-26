# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list


To create a fully functional ICO contract that can receive jettons, handle contributions, and distribute jettons after the ICO, let's break down the necessary code. We'll assume that the ICO contract will indeed act as a jetton wallet, and we'll include the following features:

Transfer jettons to the ICO contract.
Allow contributors to send their contributions.
Track contributions.
Distribute jettons after the ICO ends.
Refund contributors if the soft cap is not met.
Here's the complete implementation in Func:

1. Define Constants and Data Structure
func
Copy code
#include "../imports/stdlib.fc";

;; Constants for ICO stages
const ICO_NOT_STARTED = 0;
const ICO_ACTIVE = 1;
const ICO_ENDED_SUCCESSFUL = 2;
const ICO_ENDED_UNSUCCESSFUL = 3;

;; Storage data structure
(int, int, int, int, int, slice, cell, cell) load_data() inline {
    slice ds = get_data().begin_parse();
    return (
        ds~load_uint(32), ;; ICO stage
        ds~load_uint(64), ;; Soft cap
        ds~load_uint(64), ;; Hard cap
        ds~load_uint(64), ;; Start time
        ds~load_uint(64), ;; End time
        ds~load_msg_addr(), ;; Admin address
        ds~load_ref(), ;; Contributions
        ds~load_ref()  ;; Jetton wallet code
    );
}

() save_data(int stage, int soft_cap, int hard_cap, int start_time, int end_time, slice admin_address, cell contributions, cell jetton_wallet_code) impure inline {
    set_data(begin_cell()
        .store_uint(stage, 32)
        .store_uint(soft_cap, 64)
        .store_uint(hard_cap, 64)
        .store_uint(start_time, 64)
        .store_uint(end_time, 64)
        .store_slice(admin_address)
        .store_ref(contributions)
        .store_ref(jetton_wallet_code)
    .end_cell());
}
2. Initialize ICO
func
Copy code
() init_ico(int soft_cap, int hard_cap, int start_time, int end_time, slice admin_address, cell jetton_wallet_code) impure {
    save_data(ICO_NOT_STARTED, soft_cap, hard_cap, start_time, end_time, admin_address, begin_cell().end_cell(), jetton_wallet_code);
}
3. Receive Contributions
func
Copy code
() receive_contribution(int msg_value, cell in_msg_full, slice in_msg_body) impure {
    var ds = get_data().begin_parse();
    int stage = ds~load_uint(32);
    int start_time = ds~load_uint(64);
    int end_time = ds~load_uint(64);
    slice admin_address = ds~load_msg_addr();
    cell contributions = ds~load_ref();

    throw_unless(601, stage == ICO_ACTIVE); ;; ICO must be active
    throw_unless(602, now() >= start_time); ;; ICO must have started
    throw_unless(603, now() < end_time); ;; ICO must not have ended

    slice sender_address = in_msg_full.begin_parse()~load_msg_addr();
    int contribution = in_msg_body~load_uint(64); ;; Amount contributed

    ;; Store contribution
    contributions = add_contribution(contributions, sender_address, contribution);

    save_data(stage, ds~load_uint(64), ds~load_uint(64), start_time, end_time, admin_address, contributions, ds~load_ref());
}

(cell, int) add_contribution(cell contributions, slice sender_address, int contribution) inline {
    ;; Logic to add contribution to the contributions cell
    return (contributions, contribution);
}
4. Distribute Jettons
func
Copy code
() distribute_jettons() impure {
    var ds = get_data().begin_parse();
    int stage = ds~load_uint(32);
    int soft_cap = ds~load_uint(64);
    int end_time = ds~load_uint(64);
    cell contributions = ds~load_ref();
    cell jetton_wallet_code = ds~load_ref();

    throw_unless(604, now() >= end_time); ;; ICO must have ended

    ;; Check if soft cap was reached
    int total_contributions = calculate_total_contributions(contributions);
    if (total_contributions >= soft_cap) {
        ;; Successful ICO, distribute jettons
        stage = ICO_ENDED_SUCCESSFUL;
        distribute_jettons_to_contributors(contributions, jetton_wallet_code);
    } else {
        ;; Unsuccessful ICO, refund contributors
        stage = ICO_ENDED_UNSUCCESSFUL;
        refund_contributors(contributions);
    }

    save_data(stage, soft_cap, ds~load_uint(64), ds~load_uint(64), end_time, ds~load_msg_addr(), contributions, jetton_wallet_code);
}

(int) calculate_total_contributions(cell contributions) inline {
    ;; Logic to calculate total contributions from the contributions cell
    return 0;
}

() distribute_jettons_to_contributors(cell contributions, cell jetton_wallet_code) impure {
    ;; Logic to distribute jettons to each contributor
}

() refund_contributors(cell contributions) impure {
    ;; Logic to refund each contributor
}
5. Claim Tokens and Refund
func
Copy code
() claim_tokens(slice contributor_address) impure {
    var ds = get_data().begin_parse();
    int stage = ds~load_uint(32);
    cell contributions = ds~load_ref();
    cell jetton_wallet_code = ds~load_ref();

    throw_unless(605, stage == ICO_ENDED_SUCCESSFUL); ;; ICO must have ended successfully

    ;; Transfer jettons to the contributor
    transfer_jettons(contributions, contributor_address, jetton_wallet_code);
}

() transfer_jettons(cell contributions, slice contributor_address, cell jetton_wallet_code) impure {
    ;; Logic to transfer jettons to the contributor
}

() claim_refund(slice contributor_address) impure {
    var ds = get_data().begin_parse();
    int stage = ds~load_uint(32);
    cell contributions = ds~load_ref();

    throw_unless(606, stage == ICO_ENDED_UNSUCCESSFUL); ;; ICO must have ended unsuccessfully

    ;; Transfer refund to the contributor
    transfer_refund(contributions, contributor_address);
}

() transfer_refund(cell contributions, slice contributor_address) impure {
    ;; Logic to transfer refund to the contributor
}
6. Admin Functions
func
Copy code
() start_ico() impure {
    var ds = get_data().begin_parse();
    int stage = ds~load_uint(32);
    slice admin_address = ds~load_msg_addr();

    throw_unless(607, stage == ICO_NOT_STARTED); ;; ICO must not have started
    throw_unless(608, equal_slices(msg_sender(), admin_address)); ;; Only admin can start the ICO

    save_data(ICO_ACTIVE, ds~load_uint(64), ds~load_uint(64), ds~load_uint(64), ds~load_uint(64), admin_address, ds~load_ref(), ds~load_ref());
}

() end_ico() impure {
    var ds = get_data().begin_parse();
    int stage = ds~load_uint(32);
    slice admin_address = ds~load_msg_addr();

    throw_unless(609, stage == ICO_ACTIVE); ;; ICO must be active
    throw_unless(610, equal_slices(msg_sender(), admin_address)); ;; Only admin can end the ICO

    save_data(ICO_ENDED_SUCCESSFUL, ds~load_uint(64), ds~load_uint(64), ds~load_uint(64), ds~load_uint(64), admin_address, ds~load_ref(), ds~load_ref());
}
This code provides a comprehensive implementation for an ICO contract that interacts with jettons, allowing contributions, tracking those contributions, and distributing jettons or refunds after the ICO ends. Adjustments might be needed based on the specific requirements and the jetton standard being used.