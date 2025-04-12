import { useEffect, useRef, useState } from "react";
import { Header } from "../components/Header";
import { useAuthStore } from "../store/useAuthStore";
import { useMatchStore } from "../store/useMatchStore.js"; // Use .js extension, not .jsx
import { useMessageStore } from "../store/useMessageStore";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Loader, UserX, AlertCircle } from "lucide-react";
import MessageInput from "../components/MessageInput";
import DateCard from "../components/DateCard";
import { toast } from "react-toastify";

const ChatPage = () => {
	const { getMyMatches, matches, isLoadingMyMatches, getDateCardForMatch, unmatchUser } = useMatchStore();
	const { messages, getMessages, subscribeToMessages, unsubscribeFromMessages } = useMessageStore();
	const { authUser } = useAuthStore();
	const messagesEndRef = useRef(null);
	const [showConfirmation, setShowConfirmation] = useState(false);
	const [isUnmatching, setIsUnmatching] = useState(false);
	const navigate = useNavigate();

	const { id } = useParams();

	const match = matches.find((m) => m?._id === id);

	useEffect(() => {
		if (authUser && id) {
			getMyMatches();
			getMessages(id);
			subscribeToMessages();
		}

		return () => {
			unsubscribeFromMessages();
		};
	}, [getMyMatches, authUser, getMessages, subscribeToMessages, unsubscribeFromMessages, id]);

	// Fetch date card if needed
	useEffect(() => {
		if (match && authUser) {
			// If the match exists but has no date card or matchId, try to fetch one
			if (!match.dateCard && match.matchId) {
				getDateCardForMatch(match.matchId);
			}
		}
	}, [match, authUser, getDateCardForMatch]);

	// Scroll to bottom when new messages arrive
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const handleUnmatch = async () => {
		try {
			setIsUnmatching(true);
			console.log(`Attempting to unmatch with user: ${id}`);
			
			const success = await unmatchUser(id);
			console.log(`Unmatch result: ${success ? 'success' : 'failed'}`);
			
			if (success) {
				toast.success(`You have unmatched with ${match.name}`);
				// Navigate after a short delay to give the user a sense of completion
				setTimeout(() => {
					console.log('Navigating to home after successful unmatch');
					navigate('/');
				}, 1000);
			}
		} catch (error) {
			console.error("Error unmatching user:", error);
			toast.error("Failed to unmatch. Please try again later.");
		} finally {
			setIsUnmatching(false);
			setShowConfirmation(false);
		}
	};

	if (isLoadingMyMatches) return <LoadingMessagesUI />;
	if (!match) return <MatchNotFound />;

	return (
		<div className='flex flex-col h-screen bg-gray-100 bg-opacity-50'>
			<Header />

			<div className='flex-grow flex flex-col p-4 md:p-6 lg:p-8 overflow-hidden max-w-4xl mx-auto w-full'>
				<div className='flex items-center justify-between mb-4 bg-white rounded-lg shadow p-3'>
					<div className="flex items-center">
						<img
							src={match.image || "/avatar.png"}
							className='w-12 h-12 object-cover rounded-full mr-3 border-2 border-pink-300'
							alt={match.name}
						/>
						<h2 className='text-xl font-semibold text-gray-800'>{match.name}</h2>
					</div>
					<button 
						onClick={() => setShowConfirmation(true)}
						disabled={isUnmatching}
						className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-sm transition-colors hover:cursor-pointer"
					>
						Unmatch
					</button>
				</div>

				{/* Confirmation Dialog */}
				{showConfirmation && (
					<div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
						<div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
							<div className="flex items-center mb-4 text-red-500">
								<AlertCircle className="mr-2" size={24} />
								<h3 className="text-lg font-semibold">Confirm Unmatch</h3>
							</div>
							<p className="mb-6 text-gray-700">
								Are you sure you want to unmatch with {match.name}? This will permanently remove your conversation and you won&apos;t be able to contact each other again.
							</p>
							<div className="flex justify-end space-x-3">
								<button 
									onClick={() => setShowConfirmation(false)} 
									disabled={isUnmatching}
									className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 hover:cursor-pointer"
								>
									Cancel
								</button>
								<button 
									onClick={handleUnmatch} 
									disabled={isUnmatching}
									className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center hover:cursor-pointer"
								>
									{isUnmatching ? (
										<>
											<Loader size={16} className="animate-spin mr-2" />
											Unmatching...
										</>
									) : "Unmatch"}
								</button>
							</div>
						</div>
					</div>
				)}

				<div className='flex-grow overflow-y-auto mb-4 bg-white rounded-lg shadow p-4'>
					{/* Date Card */}
					{match.dateCard && <DateCard dateCard={match.dateCard} />}

					{messages.length === 0 ? (
						<p className='text-center text-gray-500 py-8'>Start your conversation with {match.name}</p>
					) : (
						<div className="space-y-3">
							{messages.map((msg) => (
								<div
									key={msg.id || msg._id}
									className={`mb-3 ${msg.sender_id === authUser.id || msg.sender === authUser._id ? "text-right" : "text-left"}`}
								>
									<span
										className={`inline-block p-3 rounded-lg max-w-xs lg:max-w-md ${
											msg.sender_id === authUser.id || msg.sender === authUser._id
												? "bg-pink-500 text-white"
												: "bg-gray-200 text-gray-800"
										}`}
									>
										{msg.content}
									</span>
								</div>
							))}
							<div ref={messagesEndRef} />
						</div>
					)}
				</div>
				<MessageInput match={match} />
			</div>
		</div>
	);
};
export default ChatPage;

const MatchNotFound = () => (
	<div className='h-screen flex flex-col items-center justify-center bg-gray-100 bg-opacity-50 bg-dot-pattern'>
		<div className='bg-white p-8 rounded-lg shadow-md text-center'>
			<UserX size={64} className='mx-auto text-pink-500 mb-4' />
			<h2 className='text-2xl font-semibold text-gray-800 mb-2'>Match Not Found</h2>
			<p className='text-gray-600'>Oops! It seems this match doesn&apos;t exist or has been removed.</p>
			<Link
				to='/'
				className='mt-6 px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 transition-colors 
				focus:outline-none focus:ring-2 focus:ring-pink-300 inline-block'
			>
				Go Back To Home
			</Link>
		</div>
	</div>
);

const LoadingMessagesUI = () => (
	<div className='h-screen flex flex-col items-center justify-center bg-gray-100 bg-opacity-50'>
		<div className='bg-white p-8 rounded-lg shadow-md text-center'>
			<Loader size={48} className='mx-auto text-pink-500 animate-spin mb-4' />
			<h2 className='text-2xl font-semibold text-gray-800 mb-2'>Loading Chat</h2>
			<p className='text-gray-600'>Please wait while we fetch your conversation...</p>
			<div className='mt-6 flex justify-center space-x-2'>
				<div className='w-3 h-3 bg-pink-500 rounded-full animate-bounce' style={{ animationDelay: "0s" }}></div>
				<div
					className='w-3 h-3 bg-pink-500 rounded-full animate-bounce'
					style={{ animationDelay: "0.2s" }}
				></div>
				<div
					className='w-3 h-3 bg-pink-500 rounded-full animate-bounce'
					style={{ animationDelay: "0.4s" }}
				></div>
			</div>
		</div>
	</div>
);