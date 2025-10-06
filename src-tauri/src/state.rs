use parking_lot::Mutex;
use sqlx::SqlitePool;
use std::sync::Arc;

#[derive(Clone)]
pub struct AppState {
    pub db: SqlitePool,
    pub api_key: Arc<Mutex<Option<String>>>,
}

impl AppState {
    pub fn new(db: SqlitePool, api_key: Option<String>) -> Self {
        Self {
            db,
            api_key: Arc::new(Mutex::new(api_key)),
        }
    }

    pub fn get_api_key(&self) -> Option<String> {
        self.api_key.lock().clone()
    }
}
