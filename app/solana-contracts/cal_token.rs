// CAL Token Contract
// This is a simplified implementation of the CAL token using Solana's SPL Token program

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use solana_program::{program_option::COption, pubkey::Pubkey};

declare_id!("CalctraTokenProgramID111111111111111111111111111");

#[program]
pub mod cal_token {
    use super::*;

    // Initialize a new CAL token mint
    pub fn initialize_mint(ctx: Context<InitializeMint>, decimals: u8) -> Result<()> {
        // Create a new mint with the specified decimals
        // The mint authority will be set to the program authority
        let mint_authority = ctx.accounts.authority.key();
        let token_program = ctx.accounts.token_program.to_account_info();
        let mint = ctx.accounts.mint.to_account_info();
        let rent = ctx.accounts.rent.to_account_info();

        // Initialize the mint account
        token::initialize_mint(
            CpiContext::new(
                token_program,
                token::InitializeMint {
                    mint,
                    rent,
                },
            ),
            decimals,
            mint_authority,
            Some(mint_authority),
        )?;

        Ok(())
    }

    // Mint new CAL tokens to a recipient
    pub fn mint_tokens(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
        // Only the mint authority can mint new tokens
        let token_program = ctx.accounts.token_program.to_account_info();
        let mint = ctx.accounts.mint.to_account_info();
        let to = ctx.accounts.to.to_account_info();
        let authority = ctx.accounts.authority.to_account_info();

        token::mint_to(
            CpiContext::new_with_signer(
                token_program,
                token::MintTo {
                    mint,
                    to,
                    authority,
                },
                &[],
            ),
            amount,
        )?;

        Ok(())
    }

    // Transfer CAL tokens between accounts
    pub fn transfer(ctx: Context<TransferTokens>, amount: u64) -> Result<()> {
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.from.to_account_info(),
                    to: ctx.accounts.to.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            amount,
        )?;

        Ok(())
    }

    // Burn CAL tokens
    pub fn burn_tokens(ctx: Context<BurnTokens>, amount: u64) -> Result<()> {
        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Burn {
                    mint: ctx.accounts.mint.to_account_info(),
                    from: ctx.accounts.from.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            amount,
        )?;

        Ok(())
    }

    // Change token mint authority
    pub fn set_authority(
        ctx: Context<SetAuthority>,
        authority_type: AuthorityType,
        new_authority: Option<Pubkey>,
    ) -> Result<()> {
        let auth_type = match authority_type {
            AuthorityType::MintTokens => spl_token::instruction::AuthorityType::MintTokens,
            AuthorityType::FreezeAccount => spl_token::instruction::AuthorityType::FreezeAccount,
        };

        token::set_authority(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::SetAuthority {
                    account_or_mint: ctx.accounts.mint_account.to_account_info(),
                    current_authority: ctx.accounts.current_authority.to_account_info(),
                },
            ),
            auth_type,
            new_authority.as_ref(),
        )?;

        Ok(())
    }

    // Freeze token account to prevent transfers
    pub fn freeze_account(ctx: Context<FreezeAccount>) -> Result<()> {
        token::freeze_account(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::FreezeAccount {
                    account: ctx.accounts.account.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
        )?;

        Ok(())
    }

    // Thaw (unfreeze) token account
    pub fn thaw_account(ctx: Context<ThawAccount>) -> Result<()> {
        token::thaw_account(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::ThawAccount {
                    account: ctx.accounts.account.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeMint<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct TransferTokens<'info> {
    #[account(mut)]
    pub from: Account<'info, TokenAccount>,
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct BurnTokens<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub from: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct SetAuthority<'info> {
    #[account(mut)]
    pub mint_account: Account<'info, Mint>,
    pub current_authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct FreezeAccount<'info> {
    #[account(mut)]
    pub account: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ThawAccount<'info> {
    #[account(mut)]
    pub account: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum AuthorityType {
    MintTokens,
    FreezeAccount,
} 