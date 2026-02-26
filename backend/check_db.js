const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'timesheet_db'
});

db.connect(err => {
    if (err) {
        console.error('DB Error:', err);
        process.exit(1);
    }
    db.query('DESCRIBE users;', (err, results) => {
        if (err) console.error(err);
        else console.table(results);

        db.query('SELECT * FROM users;', (err, results) => {
            if (err) console.error(err);
            else console.log('Users count:', results.length);
            process.exit(0);
        });
    });
});
