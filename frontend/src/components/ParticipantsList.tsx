import { useSessionStore } from '../store/sessionStore';
import { Vote } from '../types';
import { cn } from '../lib/utils';

interface ParticipantsListProps {
  votes: Vote[];
}

export const ParticipantsList = ({ votes }: ParticipantsListProps) => {
  const { participants, votingState } = useSessionStore();
  
  // Дедупликация по ID на случай если participant добавлен дважды
  const uniqueParticipants = participants.filter((p, index, self) => 
    index === self.findIndex((t) => t.id === p.id)
  );

  const getVoteStatus = (participantId: string) => {
    if (votingState && votingState.participantsVoted && votingState.participantsVoted.includes(participantId)) {
      return 'voted';
    }
    return 'pending';
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-5 border border-white/20">
      <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
        <span>Participants</span>
        <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
          {uniqueParticipants.length}
        </span>
      </h3>
      {uniqueParticipants.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-2xl">👤</span>
          </div>
          <p className="text-sm">No participants yet</p>
          <p className="text-xs mt-1">Share the link to invite others</p>
        </div>
      ) : (
        <div className="space-y-3">
          {uniqueParticipants.map((participant) => {
            const status = getVoteStatus(participant.id);
            const vote = votes.find((v) => v.participantId === participant.id);

            return (
              <div
                key={participant.id}
                className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-md border border-gray-100"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700 flex items-center justify-center font-semibold text-lg">
                  {participant.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{participant.name}</p>
                  {votingState && votingState.isRevealed && vote ? (
                    <p className="text-sm text-primary-600 font-semibold">
                      Voted: {vote.value}
                    </p>
                  ) : (
                    <p
                      className={cn(
                        'text-sm font-medium',
                        status === 'voted'
                          ? 'text-green-600'
                          : votingState
                          ? 'text-amber-600'
                          : 'text-gray-400'
                      )}
                    >
                      {votingState
                        ? status === 'voted'
                          ? 'Voted'
                          : 'Waiting...'
                        : 'Ready'}
                    </p>
                  )}
                </div>
                <div
                  className={cn(
                    'w-3 h-3 rounded-full shadow-sm',
                    status === 'voted' || !votingState
                      ? 'bg-green-500 shadow-green-200'
                      : 'bg-amber-400 shadow-amber-200'
                  )}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
