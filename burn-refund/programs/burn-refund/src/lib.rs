use anchor_lang::prelude::*;
use anchor_spl::token::{Burn, Mint, Token, TokenAccount};
pub mod metadata;
use metadata::TokenMetadata;
declare_id!("622WNfmPwDsWcbTmbURpGHHAokHnD5bdgHYNj6aUE9oo");

#[program]
pub mod burn_refund {
    use super::*;
    use anchor_lang::solana_program;
    use anchor_spl::token::burn;

    //create honeyland treasury with specific update authority of nfts.
    pub fn initialize(ctx: Context<Initialize>, update_authority: Pubkey) -> Result<()> {
        let treasury_account = &mut ctx.accounts.treasury_account;
        treasury_account.owner = ctx.accounts.user.key();
        treasury_account.allowed_update_authority = update_authority;
        treasury_account.bump = *ctx.bumps.get("treasury_account").unwrap();
        Ok(())
    }

    //deposit some sol by honeyland treasury owner
    pub fn deposit(ctx: Context<Deposit>, lamports: u64) -> Result<()> {
        let user_account = &mut ctx.accounts.user;
        let treasury_account = &mut ctx.accounts.treasury_account;

        let instruction = solana_program::system_instruction::transfer(
            &user_account.key(),
            &treasury_account.key(),
            lamports,
        );

        solana_program::program::invoke(
            &instruction,
            &[
                user_account.to_account_info(),
                treasury_account.to_account_info(),
            ],
        )
        .unwrap();

        let transaction: &mut Account<TransactionDetail> = &mut ctx.accounts.transaction;
        let clock: Clock = Clock::get().unwrap();

        transaction.user = user_account.key();
        transaction.timestamp = clock.unix_timestamp;
        transaction.lamports = lamports;
        transaction.paytype = 1;

        emit!(RefundEvent {
            user: user_account.key(),
            lamports: lamports,
            paytype: 1,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    //close the refund process with this function
    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        // checking for user/signer == treasury owner
        require_eq!(
            ctx.accounts.user.key(),
            ctx.accounts.treasury_account.owner,
            ErrorCode::OwnerRequired
        );
        let user_account = &mut ctx.accounts.user;
        let user_account_info = user_account.to_account_info();
        let treasury_account = &mut ctx.accounts.treasury_account;
        // msg!("sub_token_account amount :: {}", amount(&ctx.accounts.sub_token_account.to_account_info())?);
        let treasury_account_info = treasury_account.to_account_info();

        // let treasury_all_lamports = treasury_account_info.try_lamports()?;

        // //zero the user state account's lamports. need to dereference the var twice because the
        // //try_borrow_mut_lamports method retruns a RefMut<& mut u64> (?)
        // **treasury_account_info.try_borrow_mut_lamports()? = 0;

        // //give the treasury account's lamports to the owner
        // **user_account.try_borrow_mut_lamports()? = user_account
        //     .try_lamports()?
        //     .checked_add(treasury_all_lamports)
        //     .ok_or(ProgramError::AccountBorrowFailed)?;

        // //zero the user state account's data
        // *treasury_account_info.try_borrow_mut_data()? = &mut [];

        let treasury_current_lamports = treasury_account_info.clone().lamports();

        let user_starting_lamports = user_account_info.lamports();
        **user_account_info.lamports.borrow_mut() = user_starting_lamports
            .checked_add(treasury_account_info.lamports())
            .unwrap();
        **treasury_account_info.lamports.borrow_mut() = 0;

        let mut treasury_data = treasury_account_info.data.borrow_mut();
        treasury_data.fill(0);

        let transaction: &mut Account<TransactionDetail> = &mut ctx.accounts.transaction;
        let clock: Clock = Clock::get().unwrap();

        transaction.user = user_account.key();
        transaction.timestamp = clock.unix_timestamp;
        transaction.lamports = treasury_current_lamports;
        transaction.paytype = 2;

        emit!(RefundEvent {
            user: user_account.key(),
            lamports: treasury_current_lamports,
            paytype: 2,
            timestamp: Clock::get()?.unix_timestamp
        });

        Ok(())
    }

    pub fn burn_refund(ctx: Context<BurnRefund>, lamports: u64) -> Result<()> {
        //some security conditions
        // todo!("checking update authority of nft metadata");
        //check token metadata for checking specific update authority==>in progress
        //token ownership by signer==>checked in context
        //treasury has fund?==>checked in instruction

        let user_account = &mut ctx.accounts.user;
        let user_token_metadata = &mut ctx.accounts.meta;
        let treasury_account = &mut ctx.accounts.treasury_account;
        let treasury_account_info = treasury_account.to_account_info();

        let treasury_all_lamports = treasury_account_info.try_lamports()?;

        require_gte!(
            treasury_all_lamports,
            lamports,
            ErrorCode::InsufficientFunds
        );
        require_eq!(
            treasury_account.allowed_update_authority,
            user_token_metadata.update_authority,
            ErrorCode::ForbiddenNFT
        );

        //burn
        let cpi_accounts = Burn {
            mint: ctx.accounts.mint.to_account_info(),
            from: ctx.accounts.token_account.to_account_info(),
            authority: user_account.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        burn(cpi_ctx, 1)?;

        //refund
        **treasury_account_info.try_borrow_mut_lamports()? -= lamports;
        **user_account.try_borrow_mut_lamports()? += lamports;

        let transaction: &mut Account<TransactionDetail> = &mut ctx.accounts.transaction;
        let clock: Clock = Clock::get().unwrap();

        transaction.user = user_account.key();
        transaction.timestamp = clock.unix_timestamp;
        transaction.lamports = lamports;
        transaction.paytype = 3;

        emit!(RefundEvent {
            user: user_account.key(),
            lamports: lamports,
            paytype: 3,
            timestamp: Clock::get()?.unix_timestamp
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(init, payer = user, space = 8 + 1 + 32 + 32 + 32, seeds = [b"honeyland_treasury"], bump)]
    pub treasury_account: Account<'info, HoneylandTreasury>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BurnRefund<'info> {
    #[account(mut, constraint = token_account.owner == user.key())]
    pub token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub meta: Account<'info, TokenMetadata>,
    #[account(mut)]
    pub treasury_account: Account<'info, HoneylandTreasury>,
    #[account(init, payer = user, space = 8 + 32 + 8 + 1 + 8)]
    pub transaction: Account<'info, TransactionDetail>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(init, payer = user, space = 8 + 32 + 8 + 1 + 8)]
    pub transaction: Account<'info, TransactionDetail>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub treasury_account: Account<'info, HoneylandTreasury>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(init, payer = user, space = 8 + 32 + 8 + 1 + 8 +32)]
    pub transaction: Account<'info, TransactionDetail>,
    #[account(mut)]
    /// CHECK:
    pub user: Signer<'info>,
    #[account(mut)]
    pub treasury_account: Account<'info, HoneylandTreasury>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct TransactionDetail {
    pub user: Pubkey,
    pub lamports: u64,
    pub paytype: u8, //1=owner_deposit, 2=owner_withdraw, 3=user_refund
    // pub message: String,
    pub timestamp: i64,
}

#[account]
pub struct HoneylandTreasury {
    pub bump: u8,
    pub owner: Pubkey,
    pub allowed_update_authority: Pubkey,
}

// impl Payment {
//     pub const MAX_SIZE: usize = 4 + 10 * (4 + 32 + 4 + 32 + 32 + 8 + 1) + 1 + 32;
// }

#[event]
/// Emitted when tokens are redeemed.
pub struct RefundEvent {
    #[index]
    pub user: Pubkey,
    pub lamports: u64,
    pub paytype: u8, //1=owner_deposit, 2=owner_withdraw, 3=user_refund
    // pub message: String,
    pub timestamp: i64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("The Signer must be treasury owner.")]
    OwnerRequired,
    #[msg("Insufficient funds inside treasury")]
    InsufficientFunds,
    #[msg("Your NFT is not allowed by Honeyland to refund.")]
    ForbiddenNFT,
}
