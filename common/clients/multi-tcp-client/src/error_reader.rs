use futures::channel::mpsc;
use futures::StreamExt;
use log::*;
use std::io;
use std::net::SocketAddr;
use tokio::runtime::Handle;
use tokio::task::JoinHandle;

pub(crate) type ConnectionErrorResponse = (SocketAddr, io::Result<()>);
pub(crate) type ConnectionErrorSender = mpsc::UnboundedSender<ConnectionErrorResponse>;
pub(crate) type ConnectionErrorReceiver = mpsc::UnboundedReceiver<ConnectionErrorResponse>;

pub(crate) struct ConnectionErrorReader {
    error_rx: ConnectionErrorReceiver,
}

impl ConnectionErrorReader {
    pub(crate) fn new(error_rx: ConnectionErrorReceiver) -> Self {
        ConnectionErrorReader { error_rx }
    }

    pub(crate) fn start(mut self, handle: &Handle) -> JoinHandle<()> {
        handle.spawn(async move {
            while let Some(err_res) = self.error_rx.next().await {
                let (source, err) = err_res;
                match err {
                    // Ok(_) => trace!("packet to {} was sent successfully!", source.to_string()),
                    Err(e) => warn!("failed to send packet to {} - {:?}", source.to_string(), e),
                    Ok(_) => (), // right now we're not expecting to receive any 'Ok' responses
                }
            }
        })
    }
}
