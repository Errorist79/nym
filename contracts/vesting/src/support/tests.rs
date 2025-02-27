#[cfg(test)]
pub mod helpers {
    use crate::contract::instantiate;
    use crate::vesting::{populate_vesting_periods, Account};
    use config::defaults::MIX_DENOM;
    use cosmwasm_std::testing::{mock_dependencies, mock_env, mock_info, MockApi, MockQuerier};
    use cosmwasm_std::{Addr, Coin, Empty, Env, MemoryStorage, OwnedDeps, Storage, Uint128};
    use vesting_contract_common::messages::{InitMsg, VestingSpecification};

    pub fn init_contract() -> OwnedDeps<MemoryStorage, MockApi, MockQuerier<Empty>> {
        let mut deps = mock_dependencies();
        let msg = InitMsg {
            mixnet_contract_address: "test".to_string(),
        };
        let env = mock_env();
        let info = mock_info("admin", &[]);
        instantiate(deps.as_mut(), env.clone(), info, msg).unwrap();
        return deps;
    }

    pub fn vesting_account_mid_fixture(storage: &mut dyn Storage, env: &Env) -> Account {
        let start_time_ts = env.block.time.clone();
        let start_time = env.block.time.seconds() - 7200;
        let periods = populate_vesting_periods(
            start_time,
            VestingSpecification::new(None, Some(3600), None),
        );

        Account::new(
            Addr::unchecked("owner"),
            Some(Addr::unchecked("staking")),
            Coin {
                amount: Uint128::new(1_000_000_000_000),
                denom: MIX_DENOM.base.to_string(),
            },
            start_time_ts,
            periods,
            storage,
        )
        .unwrap()
    }

    pub fn vesting_account_new_fixture(storage: &mut dyn Storage, env: &Env) -> Account {
        let start_time = env.block.time;
        let periods =
            populate_vesting_periods(start_time.seconds(), VestingSpecification::default());

        Account::new(
            Addr::unchecked("owner"),
            Some(Addr::unchecked("staking")),
            Coin {
                amount: Uint128::new(1_000_000_000_000),
                denom: MIX_DENOM.base.to_string(),
            },
            start_time,
            periods,
            storage,
        )
        .unwrap()
    }
}
