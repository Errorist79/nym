use crate::config::{Config, OptionalValidators, ValidatorUrl};
use crate::error::BackendError;
use crate::network::Network;
use crate::wallet_storage::account_data::WalletAccount;

use strum::IntoEnumIterator;
use validator_client::nymd::SigningNymdClient;
use validator_client::Client;

use itertools::Itertools;
use url::Url;

use std::collections::HashMap;
use std::time::Duration;

#[derive(Default)]
pub struct State {
  config: Config,
  signing_clients: HashMap<Network, Client<SigningNymdClient>>,
  current_network: Network,

  // All the accounts the we get from decrypting the wallet. We hold on to these for being able to
  // switch accounts on-the-fly
  all_accounts: HashMap<String, DecryptedAccount>,

  /// Validators that have been fetched dynamically, probably during startup.
  fetched_validators: OptionalValidators,
}

impl State {
  pub fn client(&self, network: Network) -> Result<&Client<SigningNymdClient>, BackendError> {
    self
      .signing_clients
      .get(&network)
      .ok_or(BackendError::ClientNotInitialized)
  }

  pub fn current_client(&self) -> Result<&Client<SigningNymdClient>, BackendError> {
    self
      .signing_clients
      .get(&self.current_network)
      .ok_or(BackendError::ClientNotInitialized)
  }

  pub fn config(&self) -> &Config {
    &self.config
  }

  /// Load configuration from files. If unsuccessful we just log it and move on.
  pub fn load_config_files(&mut self) {
    self.config = Config::load_from_files();
  }

  #[allow(unused)]
  pub fn save_config_files(&self) -> Result<(), BackendError> {
    Ok(self.config.save_to_files()?)
  }

  pub fn add_client(&mut self, network: Network, client: Client<SigningNymdClient>) {
    self.signing_clients.insert(network, client);
  }

  pub fn set_network(&mut self, network: Network) {
    self.current_network = network;
  }

  pub fn current_network(&self) -> Network {
    self.current_network
  }

  pub(crate) fn set_all_accounts(&mut self, all_accounts: HashMap<String, DecryptedAccount>) {
    self.all_accounts.clear();
    self.all_accounts.extend(all_accounts)
  }

  pub(crate) fn get_all_accounts(&self) -> &HashMap<String, DecryptedAccount> {
    &self.all_accounts
  }

  pub fn logout(&mut self) {
    self.signing_clients = HashMap::new();
  }

  /// Get the available validators in the order
  /// 1. from the configuration file
  /// 2. provided remotely
  /// 3. hardcoded fallback
  pub fn get_validators(&self, network: Network) -> impl Iterator<Item = ValidatorUrl> + '_ {
    let validators_in_config = self.config.get_configured_validators(network);
    let fetched_validators = self.fetched_validators.validators(network).cloned();
    let default_validators = self.config.get_base_validators(network);

    validators_in_config
      .chain(fetched_validators)
      .chain(default_validators)
      .unique()
  }

  pub fn get_nymd_urls(&self, network: Network) -> impl Iterator<Item = Url> + '_ {
    self.get_validators(network).into_iter().map(|v| v.nymd_url)
  }

  pub fn get_api_urls(&self, network: Network) -> impl Iterator<Item = Url> + '_ {
    self
      .get_validators(network)
      .into_iter()
      .filter_map(|v| v.api_url)
  }

  pub fn get_all_nymd_urls(&self) -> HashMap<Network, Vec<Url>> {
    Network::iter()
      .flat_map(|network| self.get_nymd_urls(network).map(move |url| (network, url)))
      .into_group_map()
  }

  pub fn get_all_api_urls(&self) -> HashMap<Network, Vec<Url>> {
    Network::iter()
      .flat_map(|network| self.get_api_urls(network).map(move |url| (network, url)))
      .into_group_map()
  }

  /// Fetch validator urls remotely. These are used to in addition to the base ones, and the user
  /// configured ones.
  pub async fn fetch_updated_validator_urls(&mut self) -> Result<(), BackendError> {
    let client = reqwest::Client::builder()
      .timeout(Duration::from_secs(3))
      .build()?;
    log::debug!(
      "Fetching validator urls from: {}",
      crate::config::REMOTE_SOURCE_OF_VALIDATOR_URLS
    );
    let response = client
      .get(crate::config::REMOTE_SOURCE_OF_VALIDATOR_URLS.to_string())
      .send()
      .await?;
    self.fetched_validators = serde_json::from_str(&response.text().await?)?;
    log::debug!("Received validator urls: \n{}", self.fetched_validators);
    Ok(())
  }

  #[allow(unused)]
  pub fn select_validator_nymd_url(
    &mut self,
    url: &str,
    network: Network,
  ) -> Result<(), BackendError> {
    self.config.select_validator_nymd_url(url.parse()?, network);
    Ok(())
  }

  #[allow(unused)]
  pub fn select_validator_api_url(
    &mut self,
    url: &str,
    network: Network,
  ) -> Result<(), BackendError> {
    self.config.select_validator_api_url(url.parse()?, network);
    Ok(())
  }

  #[allow(unused)]
  pub fn add_validator_url(&mut self, url: ValidatorUrl, network: Network) {
    self.config.add_validator_url(url, network);
  }

  #[allow(unused)]
  pub fn remove_validator_url(&mut self, url: ValidatorUrl, network: Network) {
    self.config.remove_validator_url(url, network)
  }
}

#[macro_export]
macro_rules! client {
  ($state:ident) => {
    $state.read().await.current_client()?
  };
}

// Keep track of mnemonics on the backend, so we can switch accounts
#[derive(Clone)]
pub(crate) struct DecryptedAccount {
  pub id: String,
  pub mnemonic: bip39::Mnemonic,
}

impl DecryptedAccount {
  pub fn new(id: String, mnemonic: bip39::Mnemonic) -> Self {
    Self { id, mnemonic }
  }
}

impl From<&WalletAccount> for DecryptedAccount {
  fn from(wallet_account: &WalletAccount) -> Self {
    Self {
      id: wallet_account.id.to_string(),
      mnemonic: wallet_account.account.mnemonic().clone(),
    }
  }
}

#[macro_export]
macro_rules! nymd_client {
  ($state:ident) => {
    $state.read().await.current_client()?.nymd
  };
}

#[macro_export]
macro_rules! api_client {
  ($state:ident) => {
    $state.read().await.current_client()?.validator_api
  };
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn adding_validators_urls_prepends() {
    let mut state = State::default();
    let _api_urls = state.get_api_urls(Network::MAINNET).collect::<Vec<_>>();

    state.add_validator_url(
      ValidatorUrl {
        nymd_url: "http://nymd_url.com".parse().unwrap(),
        api_url: Some("http://nymd_url.com/api".parse().unwrap()),
      },
      Network::MAINNET,
    );

    state.add_validator_url(
      ValidatorUrl {
        nymd_url: "http://foo.com".parse().unwrap(),
        api_url: None,
      },
      Network::MAINNET,
    );

    state.add_validator_url(
      ValidatorUrl {
        nymd_url: "http://bar.com".parse().unwrap(),
        api_url: None,
      },
      Network::MAINNET,
    );

    assert_eq!(
      state.get_nymd_urls(Network::MAINNET).collect::<Vec<_>>(),
      vec![
        "http://nymd_url.com/".parse().unwrap(),
        "http://foo.com".parse().unwrap(),
        "http://bar.com".parse().unwrap(),
        "https://rpc.nyx.nodes.guru".parse().unwrap(),
      ],
    );
    assert_eq!(
      state.get_api_urls(Network::MAINNET).collect::<Vec<_>>(),
      vec![
        "http://nymd_url.com/api".parse().unwrap(),
        "https://api.nyx.nodes.guru".parse().unwrap(),
      ],
    );
    assert_eq!(
      state
        .get_all_nymd_urls()
        .get(&Network::MAINNET)
        .unwrap()
        .clone(),
      vec![
        "http://nymd_url.com/".parse().unwrap(),
        "http://foo.com".parse().unwrap(),
        "http://bar.com".parse().unwrap(),
        "https://rpc.nyx.nodes.guru".parse().unwrap(),
      ],
    )
  }
}
