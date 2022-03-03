#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use std::sync::Arc;

use tauri::Manager;
use tauri::{Menu, SystemTrayEvent};
use tokio::sync::RwLock;

// temporarily until it is actually used
#[allow(unused)]
use crate::menu::AddDefaultSubmenus;
use crate::menu::{create_tray_menu, tray_menu_event_handler};
use crate::state::State;
use crate::window::window_toggle;

// mod config;
mod error;
mod menu;
mod models;
mod operations;
mod state;
mod window;

fn main() {
  println!("Starting up...");

  tauri::Builder::default()
    .manage(Arc::new(RwLock::new(State::new())))
    .invoke_handler(tauri::generate_handler![
      crate::operations::connection::connect::start_connecting,
      crate::operations::connection::disconnect::start_disconnecting,
      crate::operations::window::hide_window,
    ])
    .menu(Menu::new().add_default_app_submenu_if_macos())
    .system_tray(create_tray_menu())
    .on_system_tray_event(tray_menu_event_handler)
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[cfg(test)]
mod test {
  ts_rs::export! {
    mixnet_contract_common::MixNode => "../src/types/rust/mixnode.ts",
  }
}
