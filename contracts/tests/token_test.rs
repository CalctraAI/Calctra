#[cfg(test)]
mod tests {
    use solana_program::pubkey::Pubkey;
    use solana_program_test::*;
    use solana_sdk::{
        account::Account,
        signature::{Keypair, Signer},
        transaction::Transaction,
    };
    use std::str::FromStr;
    
    // Import our token contract module
    use crate::token_contract::{process_instruction, CalToken};
    
    #[tokio::test]
    async fn test_token_initialize() {
        // Create program test environment
        let program_id = Pubkey::from_str("TokenProgram1111111111111111111111111111111").unwrap();
        let (mut banks_client, payer, recent_blockhash) = ProgramTest::new(
            "token_contract",
            program_id,
            processor!(process_instruction),
        )
        .start()
        .await;
        
        // Create mint account
        let mint_account = Keypair::new();
        let mint_authority = Keypair::new();
        
        // Create transaction to initialize the mint
        let mut transaction = Transaction::new_with_payer(
            &[create_initialize_mint_instruction(
                &program_id,
                &mint_account.pubkey(),
                &mint_authority.pubkey(),
            )],
            Some(&payer.pubkey()),
        );
        transaction.sign(&[&payer, &mint_account], recent_blockhash);
        
        // Process the transaction
        banks_client.process_transaction(transaction).await.unwrap();
        
        // Verify the mint was initialized correctly
        let mint_account_data = banks_client.get_account(mint_account.pubkey()).await.unwrap().unwrap();
        let cal_token = CalToken::unpack_from_slice(&mint_account_data.data).unwrap();
        
        assert!(cal_token.is_initialized);
        assert_eq!(cal_token.supply, 1_000_000_000);
        assert_eq!(cal_token.decimals, 9);
        assert_eq!(cal_token.mint_authority, mint_authority.pubkey());
    }
    
    #[tokio::test]
    async fn test_token_mint_to() {
        // Test implementation would go here
    }
    
    #[tokio::test]
    async fn test_token_transfer() {
        // Test implementation would go here
    }
    
    // Helper function to create an initialize mint instruction
    fn create_initialize_mint_instruction(
        program_id: &Pubkey,
        mint_account: &Pubkey,
        mint_authority: &Pubkey,
    ) -> solana_sdk::instruction::Instruction {
        solana_sdk::instruction::Instruction {
            program_id: *program_id,
            accounts: vec![
                solana_sdk::instruction::AccountMeta::new(*mint_account, true),
                solana_sdk::instruction::AccountMeta::new_readonly(*mint_authority, true),
                solana_sdk::instruction::AccountMeta::new_readonly(solana_sdk::sysvar::rent::id(), false),
            ],
            data: vec![0], // 0 = Initialize Mint instruction
        }
    }
} 