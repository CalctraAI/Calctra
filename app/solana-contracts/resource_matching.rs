// Resource Matching System Contract
// This contract handles the core resource matching functionality of the Calctra platform

use anchor_lang::prelude::*;
use anchor_spl::token::{self, TokenAccount, Transfer};
use std::collections::BTreeMap;

declare_id!("CalctraResourceMatchingID1111111111111111111111");

#[program]
pub mod resource_matching {
    use super::*;

    // Initialize the resource matching system
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let system_state = &mut ctx.accounts.system_state;
        system_state.authority = ctx.accounts.authority.key();
        system_state.resource_count = 0;
        system_state.computation_request_count = 0;
        system_state.active_matches = 0;
        Ok(())
    }

    // Register a new computational resource
    pub fn register_resource(
        ctx: Context<RegisterResource>,
        resource_type: String,
        computation_power: u64,
        available_memory: u64,
        location: String,
        price_per_unit: u64,
    ) -> Result<()> {
        let system_state = &mut ctx.accounts.system_state;
        let resource_account = &mut ctx.accounts.resource_account;
        let provider = &ctx.accounts.provider;

        // Create a new resource entry
        resource_account.resource_id = system_state.resource_count;
        resource_account.provider = provider.key();
        resource_account.resource_type = resource_type;
        resource_account.computation_power = computation_power;
        resource_account.available_memory = available_memory;
        resource_account.location = location;
        resource_account.price_per_unit = price_per_unit;
        resource_account.is_active = true;
        resource_account.reputation_score = 0;
        resource_account.total_usage_time = 0;

        // Update system state
        system_state.resource_count += 1;

        msg!("Resource registered with ID: {}", resource_account.resource_id);
        Ok(())
    }

    // Submit a computation request
    pub fn submit_computation_request(
        ctx: Context<SubmitComputationRequest>,
        computation_type: String,
        required_power: u64,
        required_memory: u64,
        max_price_per_unit: u64,
        preferred_location: Option<String>,
        duration_estimate: u64,
    ) -> Result<()> {
        let system_state = &mut ctx.accounts.system_state;
        let request_account = &mut ctx.accounts.request_account;
        let requester = &ctx.accounts.requester;

        // Create a new request entry
        request_account.request_id = system_state.computation_request_count;
        request_account.requester = requester.key();
        request_account.computation_type = computation_type;
        request_account.required_power = required_power;
        request_account.required_memory = required_memory;
        request_account.max_price_per_unit = max_price_per_unit;
        request_account.preferred_location = preferred_location;
        request_account.duration_estimate = duration_estimate;
        request_account.status = RequestStatus::Pending;
        request_account.matched_resource = None;

        // Update system state
        system_state.computation_request_count += 1;

        msg!("Computation request submitted with ID: {}", request_account.request_id);
        Ok(())
    }

    // Match a resource with a computation request (performed by the system or authorized matcher)
    pub fn match_resource(
        ctx: Context<MatchResource>,
        request_id: u64,
        resource_id: u64,
    ) -> Result<()> {
        let system_state = &mut ctx.accounts.system_state;
        let request_account = &mut ctx.accounts.request_account;
        let resource_account = &mut ctx.accounts.resource_account;

        // Verify the matcher has appropriate permission
        require!(
            ctx.accounts.matcher.key() == system_state.authority 
            || ctx.accounts.matcher.key() == resource_account.provider,
            ErrorCode::UnauthorizedMatcher
        );

        // Check if request is pending
        require!(
            request_account.status == RequestStatus::Pending,
            ErrorCode::RequestNotPending
        );

        // Check if resource is active
        require!(resource_account.is_active, ErrorCode::ResourceNotActive);

        // Check if resource meets requirements
        require!(
            resource_account.computation_power >= request_account.required_power,
            ErrorCode::InsufficientComputationPower
        );
        
        require!(
            resource_account.available_memory >= request_account.required_memory,
            ErrorCode::InsufficientMemory
        );
        
        require!(
            resource_account.price_per_unit <= request_account.max_price_per_unit,
            ErrorCode::PriceTooHigh
        );

        // Match the resource with the request
        request_account.status = RequestStatus::Matched;
        request_account.matched_resource = Some(resource_id);
        
        // Update system state
        system_state.active_matches += 1;

        msg!("Resource {} matched with request {}", resource_id, request_id);
        Ok(())
    }

    // Complete a computation task
    pub fn complete_computation(
        ctx: Context<CompleteComputation>,
        request_id: u64,
        actual_duration: u64,
        success: bool,
    ) -> Result<()> {
        let system_state = &mut ctx.accounts.system_state;
        let request_account = &mut ctx.accounts.request_account;
        let resource_account = &mut ctx.accounts.resource_account;
        
        // Verify either the requester or the provider is completing the computation
        require!(
            ctx.accounts.authority.key() == request_account.requester 
            || ctx.accounts.authority.key() == resource_account.provider
            || ctx.accounts.authority.key() == system_state.authority,
            ErrorCode::UnauthorizedCompletion
        );

        // Check if request is matched
        require!(
            request_account.status == RequestStatus::Matched,
            ErrorCode::RequestNotMatched
        );

        // Check if the matched resource is correct
        require!(
            request_account.matched_resource == Some(resource_account.resource_id),
            ErrorCode::ResourceMismatch
        );

        // Update resource stats
        resource_account.total_usage_time += actual_duration;
        
        // If successful, update reputation score (simple implementation)
        if success {
            resource_account.reputation_score = resource_account.reputation_score.saturating_add(1);
        } else {
            resource_account.reputation_score = resource_account.reputation_score.saturating_sub(1);
        }

        // Update request status
        request_account.status = if success {
            RequestStatus::Completed
        } else {
            RequestStatus::Failed
        };

        // Update system state
        system_state.active_matches -= 1;

        msg!("Computation for request {} completed with status: {}", 
            request_id, 
            if success { "success" } else { "failure" }
        );
        
        Ok(())
    }
}

#[account]
pub struct SystemState {
    pub authority: Pubkey,
    pub resource_count: u64,
    pub computation_request_count: u64,
    pub active_matches: u64,
}

#[account]
pub struct ResourceAccount {
    pub resource_id: u64,
    pub provider: Pubkey,
    pub resource_type: String,
    pub computation_power: u64,
    pub available_memory: u64,
    pub location: String,
    pub price_per_unit: u64,
    pub is_active: bool,
    pub reputation_score: i64,
    pub total_usage_time: u64,
}

#[account]
pub struct ComputationRequest {
    pub request_id: u64,
    pub requester: Pubkey,
    pub computation_type: String,
    pub required_power: u64,
    pub required_memory: u64,
    pub max_price_per_unit: u64,
    pub preferred_location: Option<String>,
    pub duration_estimate: u64,
    pub status: RequestStatus,
    pub matched_resource: Option<u64>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum RequestStatus {
    Pending,
    Matched,
    Completed,
    Failed,
    Cancelled,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 8 + 8 + 8)]
    pub system_state: Account<'info, SystemState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterResource<'info> {
    #[account(mut)]
    pub system_state: Account<'info, SystemState>,
    #[account(
        init,
        payer = provider,
        space = 8 + 8 + 32 + 100 + 8 + 8 + 100 + 8 + 1 + 8 + 8
    )]
    pub resource_account: Account<'info, ResourceAccount>,
    #[account(mut)]
    pub provider: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitComputationRequest<'info> {
    #[account(mut)]
    pub system_state: Account<'info, SystemState>,
    #[account(
        init,
        payer = requester,
        space = 8 + 8 + 32 + 100 + 8 + 8 + 8 + 100 + 8 + 4 + 8
    )]
    pub request_account: Account<'info, ComputationRequest>,
    #[account(mut)]
    pub requester: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MatchResource<'info> {
    #[account(mut)]
    pub system_state: Account<'info, SystemState>,
    #[account(mut)]
    pub request_account: Account<'info, ComputationRequest>,
    #[account(mut)]
    pub resource_account: Account<'info, ResourceAccount>,
    pub matcher: Signer<'info>,
}

#[derive(Accounts)]
pub struct CompleteComputation<'info> {
    #[account(mut)]
    pub system_state: Account<'info, SystemState>,
    #[account(mut)]
    pub request_account: Account<'info, ComputationRequest>,
    #[account(mut)]
    pub resource_account: Account<'info, ResourceAccount>,
    pub authority: Signer<'info>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized matcher")]
    UnauthorizedMatcher,
    #[msg("Request is not in pending status")]
    RequestNotPending,
    #[msg("Resource is not active")]
    ResourceNotActive,
    #[msg("Resource has insufficient computation power")]
    InsufficientComputationPower,
    #[msg("Resource has insufficient memory")]
    InsufficientMemory,
    #[msg("Resource price is too high")]
    PriceTooHigh,
    #[msg("Unauthorized completion")]
    UnauthorizedCompletion,
    #[msg("Request is not in matched status")]
    RequestNotMatched,
    #[msg("Resource mismatch")]
    ResourceMismatch,
} 