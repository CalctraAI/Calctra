use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
    program_pack::{Pack, IsInitialized},
    system_instruction,
    sysvar::{clock::Clock, Sysvar},
};

// Resource matching program state
#[derive(Clone, Debug, Default, PartialEq)]
pub struct ResourceData {
    pub is_initialized: bool,
    pub provider: Pubkey,
    pub cpu_cores: u16,
    pub memory_gb: u16,
    pub storage_gb: u32,
    pub gpu_type: [u8; 32],
    pub gpu_memory_gb: u16,
    pub price_per_hour: u64,
    pub availability: bool,
    pub reputation_score: u8,
    pub location_code: [u8; 2],
}

// Computation request state
#[derive(Clone, Debug, Default, PartialEq)]
pub struct ComputationRequest {
    pub is_initialized: bool,
    pub requester: Pubkey,
    pub min_cpu_cores: u16,
    pub min_memory_gb: u16,
    pub min_storage_gb: u32,
    pub needs_gpu: bool,
    pub min_gpu_memory_gb: u16,
    pub max_price_per_hour: u64,
    pub preferred_location: [u8; 2],
    pub min_reputation: u8,
    pub status: RequestStatus,
    pub matched_provider: Option<Pubkey>,
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum RequestStatus {
    Pending,
    Matched,
    InProgress,
    Completed,
    Failed,
    Cancelled,
}

// Program entry point
entrypoint!(process_instruction);

// Program logic
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    msg!("Resource Matching contract: process instruction");
    
    // Parse the instruction
    let instruction = MatchingInstruction::unpack(instruction_data)?;
    
    // Process the instruction
    match instruction {
        MatchingInstruction::RegisterResource => {
            msg!("Instruction: RegisterResource");
            process_register_resource(program_id, accounts, resource_data)
        }
        MatchingInstruction::UpdateResource => {
            msg!("Instruction: UpdateResource");
            process_update_resource(program_id, accounts, resource_data)
        }
        MatchingInstruction::SubmitRequest => {
            msg!("Instruction: SubmitRequest");
            process_submit_request(program_id, accounts, request_data)
        }
        MatchingInstruction::MatchRequest => {
            msg!("Instruction: MatchRequest");
            process_match_request(program_id, accounts)
        }
    }
}

// Register a new computational resource
fn process_register_resource(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    resource_data: ResourceData,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    
    // Get accounts
    let resource_account = next_account_info(account_info_iter)?;
    let provider_account = next_account_info(account_info_iter)?;
    
    // Verify ownership
    if resource_account.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }
    
    // Verify provider is signer
    if !provider_account.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    
    // Initialize resource data
    let mut data = ResourceData {
        is_initialized: true,
        provider: *provider_account.key,
        ..resource_data
    };
    
    // Save to account
    data.pack_into_slice(&mut resource_account.data.borrow_mut());
    
    msg!("Resource registered successfully");
    Ok(())
}

// Match a computation request with available resources
fn process_match_request(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    
    // Get accounts
    let request_account = next_account_info(account_info_iter)?;
    let matching_engine = next_account_info(account_info_iter)?;
    
    // Verify ownership and authority
    if request_account.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }
    
    if !matching_engine.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    
    // Unpack request data
    let mut request_data = ComputationRequest::unpack_from_slice(&request_account.data.borrow())?;
    
    // Verify request is pending
    if request_data.status != RequestStatus::Pending {
        return Err(ProgramError::InvalidAccountData);
    }
    
    // In a real implementation, this would search through all available resources
    // and find the best match using an algorithm. For simplicity, we assume a match
    // was found and just update the status.
    
    // Here would be the AI matching algorithm that considers:
    // - Resource specifications
    // - Price constraints
    // - Geographic preferences
    // - Reputation scores
    // - Current load and availability
    
    // Update request status
    request_data.status = RequestStatus::Matched;
    // The matched provider would be set here
    
    // Save updated request
    request_data.pack_into_slice(&mut request_account.data.borrow_mut());
    
    msg!("Computation request matched successfully");
    Ok(())
}

// Other functions would be implemented here:
// process_update_resource, process_submit_request, etc.

// Instruction types
enum MatchingInstruction {
    RegisterResource,
    UpdateResource,
    SubmitRequest,
    MatchRequest,
}

impl MatchingInstruction {
    // Unpacks a byte buffer into a MatchingInstruction
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let (&tag, _) = input.split_first().ok_or(ProgramError::InvalidInstructionData)?;
        
        Ok(match tag {
            0 => Self::RegisterResource,
            1 => Self::UpdateResource,
            2 => Self::SubmitRequest,
            3 => Self::MatchRequest,
            _ => return Err(ProgramError::InvalidInstructionData),
        })
    }
} 