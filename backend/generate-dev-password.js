import bcrypt from 'bcryptjs';

const password = 'dev123456';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    return;
  }
  
  console.log('Password:', password);
  console.log('BCrypt Hash:', hash);
  
  // Test the hash
  bcrypt.compare(password, hash, (err, result) => {
    if (err) {
      console.error('Error comparing:', err);
      return;
    }
    console.log('Hash verification:', result ? 'SUCCESS' : 'FAILED');
  });
});