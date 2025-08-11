const bcrypt = require('bcryptjs');

const senhaPlana = 'weslenlins050304';
const saltRounds = 10; // Custo do hash (quanto maior, mais lento e seguro)

bcrypt.hash(senhaPlana, saltRounds, function(err, hash) {
    if (err) {
        console.error('Erro ao gerar o hash:', err);
        return;
    }
    console.log('Hash da senha:', hash);
    // Este 'hash' é o que você deve armazenar no seu banco de dados na coluna `senha_hash`.

    // Exemplo de como verificar a senha mais tarde:
    bcrypt.compare(senhaPlana, hash, function(err, result) {
        if (err) {
            console.error('Erro ao comparar a senha:', err);
            return;
        }
        if (result) {
            console.log('Senha correta!');
        } else {
            console.log('Senha incorreta!');
        }
    });
});